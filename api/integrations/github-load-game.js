
import { getGithubDetailsSensitive } from '../../api-util/mongo.js';
import { parseGfEngineConfig, gitDirectory, execInDir, fileIsIgnored } from '../../api-util/util.js';

import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

export default async function handler(request, response) {

    let query;
    try {
        query = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const ghDetails = await getGithubDetailsSensitive(query);
    if (ghDetails.error)             return response.status(400).json({ error: ghDetails.error });
    else if (!ghDetails.integration) return response.status(400).json({ error: 'github unauthorized' });

    const dir = path.join('/tmp', gitDirectory);
    // Use auth token to clone anything the user has access to
    // unfortunately, this means we can't pass this off to the client-side
    // If gh.token is undefined, you can still clone public repositories
    const cloneUrl = `https://x-access-token:${ghDetails.token}@github.com/` + query.repo;

    try {
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir);
    } catch (e) {
        console.error(e);
        return response.status(500).json({ error: 'server error: failed to create directory' });
    }

    git.clone({ fs, http, dir, url: cloneUrl }).then(async () => {
        let configTextTemp;
        try {
            configTextTemp = fs.readFileSync(path.join(dir, '.gfengine'), 'utf8');
        } catch (e) {
            return response.status(400).json({ error: 'no .gfengine file in repository' });
        }
        const configText  = configTextTemp;
        const config = await parseGfEngineConfig(configText, dir);

        const out = await execInDir('git rev-parse --verify HEAD');
        const commitHash = out.stdout.split('\n')[0];

        // Read objects file as json
        let projectData;
        try {
            projectData = fs.readFileSync(path.join(config.folder, config.objects), 'utf8');
            projectData = JSON.parse(projectData);
            projectData.files = {};
            projectData.integrations = {
                github: true,
                githubRepo: query.repo,
                git: true,
                gitUrl: query.url,
                gitCommitHash: commitHash,
            }
        } catch (e) {
            return response.status(400).json({ error: 'invalid or missing objects file' });
        }

        const addFiles = (newdir, relpath) => {
            fs.readdirSync(config.folder).forEach(file => {
                if (fileIsIgnored(relpath, file, config)) return;
                
                const filepath = path.join(newdir, file);
                if (fs.lstatSync(filepath).isDirectory()) {
                    addFiles(filepath, relpath + file + '/');
                } else {
                    projectData.files[relpath + file] = fs.readFileSync(filepath, 'utf8');
                }
            });
        }
        addFiles(config.folder, '');

        return response.status(200).json({ success: true, data: projectData });
    }).catch((e) => {
        if (e.data?.statusMessage == 'Unauthorized') {
            console.log('GH unauthorized');
            return response.status(401).json({ error: 'github unauthorized' });
        } else if (e.data?.statusMessage === 'Forbidden') {
            return response.status(401).json({ error: 'need permissions' });
            
        } else console.error(e);
        return response.status(500).json({ error: 'unable to clone repository' });
    });
}
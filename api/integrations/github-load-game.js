
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

    const dir = path.join(process.cwd(), gitDirectory);
    // Use auth token to clone anything the user has access to
    // unfortunately, this means we can't pass this off to the client-side
    // If gh.token is undefined, you can still clone public repositories
    const cloneUrl = `https://x-access-token:${ghDetails.token}@github.com/` + query.repo;
    git.clone({ fs, http, dir, url: cloneUrl }).then(async () => {
        const configText = fs.readFileSync(path.join(dir, '.gfengine'), 'utf8');
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
                if (fileIsIgnored(path, file, config)) return;
                
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
        } else console.error(e);
        return response.status(500).json({ error: 'unable to clone repository' });
    });
}
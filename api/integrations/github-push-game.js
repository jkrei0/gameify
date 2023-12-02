import { getGithubDetailsSensitive } from '../../api-util/mongo.js';
import { execInDir, gitDirectory, fileIsIgnored, parseGfEngineConfig } from '../../api-util/util.js';

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

    if (!query.message || !query.data) {
        return response.status(400).json({ error: 'invalid query' });
    } else if (!query.data.integrations || !query.data.integrations.github) {
        return response.status(400).json({ error: 'not a github repository' });
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
            configTextTemp = query.data.files['.gfengine'] || fs.readFileSync(path.join(dir, '.gfengine'), 'utf8');
        } catch (e) {
            return response.status(400).json({ error: 'no .gfengine file in repository' });
        }
        const configText  = configTextTemp;
        const config = await parseGfEngineConfig(configText, dir);

        const delFiles = (newdir, relpath) => {
            fs.readdirSync(config.folder).forEach(file => {
                if (fileIsIgnored(relpath, file, config)) return;
                
                const filepath = path.join(newdir, file);
                if (fs.lstatSync(filepath).isDirectory()) {
                    delFiles(filepath, relpath + file + '/');

                } else if (!query.data.files[relpath + file]) {
                    // File was deleted, remove it
                    fs.unlink(filepath, () => {});
                }
            });
        }
        delFiles(config.folder, '');

        // Write files from sent project
        for (const file in query.data.files) {
            if (fileIsIgnored('', file, config)) continue; // Don't write ignored files
            fs.writeFileSync(path.join(config.folder, file), query.data.files[file]);
        }
        fs.writeFileSync(
            path.join(config.folder, config.objects),
            JSON.stringify({ "objects": query.data.objects }, null, 2)
        );

        // Sanitize message and hash strings (and limit message to 75 chars)
        let message = query.message.replace(/[^a-zA-Z0-9 _.,\n-]/g, '_').slice(0, 75);
        const commitHash = query.data.integrations.gitCommitHash.replace(/[^a-z0-9]/g, '');

        // Trim message, replace space w/ _, remove anything else
        const messageSimple = message.slice(0, 25).replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        // Commit message + 4 random numbers + first few hash characters should be a good unique branch name
        // The random numbers are because someone might try to commit the same thing multiple times
        // And same message + same base commit would result in the same branch name.
        const randomNum = Math.floor(Math.random()*10000).toString().padStart(4, '0')
        const branchName = messageSimple + '_' + randomNum + '_' + commitHash.slice(0, 7);
        await execInDir(`git branch ${branchName} ${commitHash}`);
        await execInDir(`git add *`);
        try {
            await execInDir(`git commit -m "${message}"`);
        } catch (e) {
            if (e.stdout.includes('nothing to commit')) {
                return response.status(200).json({ success: true, message: 'no changes', hash: commitHash });
            } else {
                return response.status(500).json({ error: 'error committing changes' });
            }
        }

        const originOut = await execInDir(`git remote show origin`);
        const mainBranch = originOut.stdout.split('HEAD branch: ')[1].split('\n')[0];

        await execInDir(`git checkout ${mainBranch}`);
        const mergeOut = await execInDir(`git merge ${branchName}`);
        if (mergeOut.stdout.includes('CONFLICT')) {
            // If conflict, abort and push to origin
            // Then they can resolve problems on their own.
            await execInDir(`git merge --abort`);
            await execInDir(`git checkout ${branchName}`);
            await execInDir(`git push -u origin ${branchName}`);
            return response.status(400).json({ error: 'merge conflict', branch: branchName });

        } else {
            // Everything's fine, push to origin
            await execInDir(`git push`);
            const out = await execInDir('git rev-parse --verify HEAD');
            const commitHash = out.stdout.split('\n')[0];
            return response.status(200).json({ success: true, message: 'Succesfully pushed changes', hash: commitHash });
        }

        
    }).catch((e) => {
        if (e.data?.statusMessage == 'Unauthorized') {
            console.log('GH unauthorized');
            return response.status(401).json({ error: 'github unauthorized' });
        } else if (e.data?.statusMessage === 'Forbidden') {
            return response.status(401).json({ error: 'need permissions' });
            
        } else console.error(e);
        return response.status(500).json({ error: 'unable to clone repository, or error pushing changes' });
    });;
}
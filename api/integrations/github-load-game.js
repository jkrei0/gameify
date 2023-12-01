
import { getGithubDetailsSensitive } from '../games-store/mongo.js';

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

    const dir = path.join(process.cwd(), 'project-dir');
    // Use auth token to clone anything the user has access to
    // unfortunately, this means we can't pass this off to the client-side
    // If gh.token is undefined, you can still clone public repositories
    const cloneUrl = `https://x-access-token:${ghDetails.token}@github.com/` + query.repo;
    git.clone({ fs, http, dir, url: cloneUrl }).then(() => {
        const configText = fs.readFileSync(path.join(dir, '.gfengine'), 'utf8');
        const config = {
            folder: 'game',
            objects: 'objfile.gpj',
            ignore: ['.git']
        }
        for (const line of configText.split('\n')) {
            if (line.startsWith('#')) continue;
            const param = line.split(':')[0].trim();
            const value = line.split(':')[1].trim();

            if      (param == 'FOLDER')   config.folder = path.join(dir, value);
            else if (param == 'OBJECTS')  config.objects = value;
            else if (param == 'IGNORE')   config.ignore.push(value);
        }
        // Don't include the objects file
        config.ignore.push(config.objects);

        // Read objects file as json
        let projectData;
        try {
            projectData = fs.readFileSync(path.join(config.folder, config.objects), 'utf8');
            projectData = JSON.parse(projectData);
            projectData.files = {};
            projectData.integrations = {
                github: true,
                githubRepo: query.repo
            }
        } catch {
            return response.status(400).json({ error: 'invalid or missing objects file' });
        }

        const addFiles = (newdir, relpath) => {
            fs.readdirSync(config.folder).forEach(file => {
                if (config.ignore.includes(file)) return;
                
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
    });
}
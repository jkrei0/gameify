
import { getGithubDetailsSensitive } from '../games-store/mongo.js';

export default async function handler(request, response) {
    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const ghDetails = await getGithubDetailsSensitive(body);
    const result = {
        integration: ghDetails.integration
    }
    if (!ghDetails.integration) {
        return response.status(200).json(result);
    }

    // Use ct to count the amount of running requests
    let ct = 0;
    // Create a new request
    const start = () => {
        ct += 1;
    }
    // Mark a requiest as successful
    // If all requests are complete, return the result
    const done = () => {
        ct -= 1;
        if (ct === 0) {
            // After all details have been fetched
            return response.status(200).json(result);
        }
    }
    // Mark a requiest as failed
    // If all requests are complete, return the result
    const fail = (error) => {
        ct -= 1;
        if (result.error) result.error += ';';
        else result.error = '';

        result.error += error;
        return response.status(500).json(result);
    }

    // This gameify API is a bit different
    // It uses cascading objects to specify what to return
    // ie. fetch(... query: { user: { repos: true } })
    if (body.query?.user) {
        start();
        fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + ghDetails.token
            }
        }).then(res => res.json()).then(userResult => {
            if (!userResult.login) {
                console.error(userResult);
                return fail('failed to fetch user details');
            }
            userResult.user = {
                login: userResult.login,
                name: userResult.name,
                avatar_url: userResult.avatar_url
            }
            done();

        }).catch(err => {
            console.error(err);
            fail('failed to fetch user details');
        });
    }
    if (body.query?.repos) {
        start();
        fetch(`https://api.github.com/user/repos`, {
            method: 'GET',
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
                "Authorization": "Bearer " + ghDetails.token
            }
        }).then(res => res.json()).then(reposResult => {
            if (reposResult.message) {
                console.error(reposResult);
                return fail('failed to fetch repos');
            }
            if (!reposResult[0]?.id) {
                result.repos = []
                return done();
            }
            result.repos = reposResult.map(repo => {return {
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                owner: repo.owner.login,
                permissions: repo.permissions
            }});
            done();
        });
    }

    start(); done();
}
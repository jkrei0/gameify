
import { saveGithubToken } from '../games-store/mongo.js';
import { https } from 'https';

export default async function handler(request, response) {

    let query;
    try {
        query = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Accept": "application/json",
        },
        body: new URLSearchParams({
            'client_id': process.env.GITHUB_CLIENT_ID,
            'client_secret': process.env.GITHUB_CLIENT_SECRET,
            'code': query.code
        })
    })
    .then(res => res.json())
    .then(result => {
        query.token = result.access_token;
        const result = saveGithubToken(query);
        response.status(200).json(result);

    }).catch(error => {
        console.error("Error exchanging code:", error);
        response.status(500).json({ error: 'error exchanging code' });
    });
}
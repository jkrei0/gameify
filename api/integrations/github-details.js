
import { getGithubDetails } from '../games-store/mongo.js';

export default async function handler(request, response) {
    let query;
    try {
        query = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const result = await getGithubDetails(query);
    return response.status(200).json(result);
}
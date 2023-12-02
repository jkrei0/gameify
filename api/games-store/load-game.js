
import { loadGame } from '../../api-util/mongo.js';

export default async function handler(request, response) {
    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const result = await loadGame(body);

    response.status(200).json(result);
}
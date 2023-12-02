
import { saveGame, deleteGame } from '../../api-util/mongo.js';

export default async function handler(request, response) {
    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    if (body.delete === true) {
        const result = await deleteGame(body);
        return response.status(200).json(result);

    } else {
        const result = await saveGame(body);
        response.status(200).json(result);
    }

}
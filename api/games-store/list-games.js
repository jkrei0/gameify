
import { listGames } from './mongo.js';

export default async function handler(request, response) {
    const result = await listGames(JSON.parse(request.body));

    response.status(200).json(result);
}
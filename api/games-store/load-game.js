
import { loadGame } from '../../api-util/mongo.js';

export default async function handler(request, response) {


    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        response.writeHead(400, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        });
        response.write(JSON.stringify({ error: 'invalid request body' }));
        response.end();

        return //response.json({ error: 'invalid request body' });
    }

    const result = await loadGame(body);

    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    });
    response.write(JSON.stringify(result));
    response.end();
}

import { login } from './mongo.js';

export default async function handler(request, response) {
    console.log(request.body);

    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const result = await login(body);

    response.status(200).json({
        success: (result.error ? false : true),
        sessionKey: result.sessionKey
    });
}
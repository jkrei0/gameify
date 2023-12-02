
import { login } from '../../api-util/mongo.js';

export default async function handler(request, response) {

    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const result = await login(body);

    const out = {
        success: (result.error ? false : true),
        sessionKey: result.sessionKey
    }
    if (result.error) out.error = result.error;

    response.status(200).json(out);
}

import { login } from './mongo.js';

export default async function handler(request, response) {
    const result = await login(JSON.parse(request.body));

    response.status(200).json({
        success: (result.error ? false : true),
        sessionKey: result.sessionKey
    });
}
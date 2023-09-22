
import { login, hashPassword } from './mongo.js';

export default async function handler(request, response) {
    const sessionKey = await login(JSON.parse(request.body));
    response.status(200).json({
        success: (sessionKey ? true : false),
        sessionKey: sessionKey
    });
}
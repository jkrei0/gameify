
import { changePassword } from '../../api-util/mongo.js';

export default async function handler(request, response) {

    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    const result = await changePassword(body);

    response.status(200).json({
        success: (result.error ? false : true)
    });
}
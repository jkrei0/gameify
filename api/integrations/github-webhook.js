
export default async function handler(request, response) {
    response.status(200).json({ping: true});
}
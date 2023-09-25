

import { MongoClient, ServerApiVersion } from 'mongodb';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const uri = `mongodb+srv://${process.env.MONGO_NAME}:${process.env.MONGO_PASSWORD}@gameify.xr6hrtj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connect(callback) {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("gameify");
        await database.command({ ping: 1 }); // ping to confirm

        return await callback(database);

    } catch (e) {
        console.error(e);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function verifySession(username, sessionKey) {
    return connect(async (database) => {
        const sessions = database.collection("sessions");
        const session = await sessions.findOne({ username: username, sessionKey: sessionKey });

        if (!session) return { error: 'session invalid', valid: false };
        if (session.expires < Date.now()) {
            await sessions.deleteOne({ username: username, sessionKey: sessionKey });
            return { error: 'session expired', valid: false };
        }
        else return { valid: true };
    });
}

export async function hashPassword(pass) {

    bcrypt.hash(pass, 10, function (err, hash) {
        console.log(hash);
    });

}

export async function login(query) {

    if (!query.username || !query.password) {
        return { error: 'missing username or password' };
    }

    return connect(async (database) => {
        const accounts = database.collection("accounts");
        const user = await accounts.findOne({ username: query.username });

        if (!user) return { error: 'incorrect username or password' };
        const pass_correct = await bcrypt.compare(query.password, user.password);
        if (pass_correct !== true) return { error: 'incorrect username or password' };

        // Credentials are valid

        const sessions = database.collection("sessions");
        const expires_hours = 5;
        const key = crypto.randomBytes(16).toString('base64');
        await sessions.insertOne({
            username: user.username,
            sessionKey: key,
            expires: Date.now() + expires_hours * 60 * 60 * 1000
        });

        return { sessionKey: key };

    });
}

export async function saveGame(query) {
    // Note: You can only save your own game (by design)
    // because the username used to verify the session is the same as the
    // one used to save the game.
    const result = await verifySession(query.username, query.sessionKey);
    if (result.error) return { error: result.error };
    if (!result.valid) return { error: 'session invalid' };

    return connect(async (database) => {
        const games = database.collection("games");

        await games.updateOne({ username: query.username, title: query.title }, { $set: {
            timestamp: Date.now(),
            title: query.title,
            data: query.data
        } }, { upsert: true }); // create new entry if none exists

        return { success: true };
    });
}

export async function listGames(query) {
    const result = await verifySession(query.username, query.sessionKey);
    if (result.error) return { error: result.error };
    if (!result.valid) return { error: 'session invalid' };

    return connect(async (database) => {
        const games = database.collection("games");

        const result = await games.find({ username: query.username }, { projection: { _id: 0, title: 1 } }).toArray();
        if (!result) return { error: 'no games found' };

        return { games: result };
    });

}

export async function loadGame(query) {
    // No session validation for loading
    // (anyone is allowed to see uploaded games)

    return connect(async (database) => {
        const games = database.collection("games");

        const result = await games.findOne({ username: query.username, title: query.title });
        if (!result) return { error: 'game not found' };

        return { data: result.data, timestamp: result.timestamp };
    });
}
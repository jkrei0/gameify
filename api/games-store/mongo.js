

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
        console.log("Pinged deployment. Successfully connected to MongoDB!");

        return await callback(database);

    } catch (e) {
        console.error(e);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

export async function hashPassword(pass) {

    bcrypt.hash(pass, 10, function (err, hash) {
        console.log(hash);
    });

}

export async function login(query) {

    if (!query.username || !query.password) {
        console.log('no user/pass', query);
        return false;
    }

    return connect(async (database) => {
        const accounts = database.collection("accounts");
        const user = await accounts.findOne({ username: query.username });

        const pass_correct = await bcrypt.compare(query.password, user.password);

        if (!user || pass_correct !== true) {
            return false;
        }

        // Credentials are valid

        const sessions = database.collection("sessions");
        const expires_hours = 5;
        const key = crypto.randomBytes(16).toString('base64');
        await sessions.insertOne({
            username: user.username,
            sessionKey: key,
            expires: Date.now() + expires_hours * 60 * 60 * 1000
        });

        console.log(key);
        return key;

    });
}
import { MongoClient, Db } from 'mongodb';

/** A thin wrapper around [[`MongoClient`]]. */
export default class DbClient {
    client: MongoClient;

    constructor(connectionString: string) {
        this.client = new MongoClient(connectionString, {
            useUnifiedTopology: true,
        });
    }

    public async connect() {
        await this.client.connect();
    }

    public db(dbName: string): Db {
        return this.client.db(dbName);
    }

    public disconnect() {
        this.client.close();
    }
}

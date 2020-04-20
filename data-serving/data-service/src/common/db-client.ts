import { MongoClient, Db } from 'mongodb';

/** A thin wrapper around [[`MongoClient`]]. */
export default class DbClient {
    client: MongoClient;

    constructor(connectionString: string) {
        this.client = new MongoClient(connectionString, {
            useUnifiedTopology: true,
        });
    }

    async connect() {
        await this.client.connect();
    }

    db(dbName: string): Db {
        return this.client.db(dbName);
    }

    disconnect() {
        this.client.close();
    }
}

import { MongoClient } from 'mongodb';

class DbClient {
    client: MongoClient;

    constructor() {
        this.client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });
    }

    public async connect() {
        await this.client.connect();
        return this.client;
    }

    public disconnect() {
        this.client.close();
    }
}

export = new DbClient();

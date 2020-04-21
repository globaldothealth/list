import { Db } from 'mongodb';

const SOURCES_COLLECTION = 'sources';

export interface Store {
    listSources(): Promise<Array<object>>;
}

export class MongoStore implements Store {
    constructor(private readonly db: Db) {}
    async listSources(): Promise<Array<object>> {
        const col = this.db.collection(SOURCES_COLLECTION);
        return await col.find().toArray();
    }
}

export class MemStore implements Store {
    sources: Array<object> = [];

    async listSources(): Promise<Array<object>> {
        console.log('listing sources from memory');
        return await new Promise((resolve, _) => {
            resolve(this.sources);
        });
    }
}

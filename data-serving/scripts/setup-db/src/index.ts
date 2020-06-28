declare let args: SetupDatabaseParameters;

interface SetupDatabaseParameters {
    connectionString: string;
    databaseName: string;
    collectionName: string;
    schemaPath: string;
}

const setupDatabase = async ({
    connectionString,
    databaseName,
    collectionName,
    schemaPath,
}: SetupDatabaseParameters): Promise<void> => {
    try {
        const schema = JSON.parse(await cat(schemaPath));
        print(`Read schema from ${schemaPath}`);

        // Connect to the default MongoDb instance.
        const connection: Connection = new Mongo(connectionString);
        print(`Connected to instance at ${connection['host']}`);

        // Get or create the database. (If it doesn't exist, it will be created.)
        const database = await connection.getDB(databaseName);
        print(`Connected to database "${database}"`);

        // If the collection already exists, drop it so we can recreate it
        // fresh.
        if (
            (await database.getCollectionNames()).some(
                (c) => c == collectionName,
            )
        ) {
            await (await database.getCollection(collectionName)).drop();
            print('Dropped existing collection');
        }

        await database.createCollection(collectionName, {
            validator: schema,
        });
        print(`Created collection "${collectionName}" with schema`);

        const collection = await database.getCollection(collectionName);

        // Print some stats -- for fun and confirmation!
        const stats = await collection.stats();
        printjson({
            collection: stats.ns,
            documents: stats.count,
            indexes: stats.nindexes,
        });

        print('Thank you for joining us 💾');
    } catch (e) {
        printjson(e);
        quit();
    }
};

setupDatabase(args);

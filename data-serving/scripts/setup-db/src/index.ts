declare let args: SetupDatabaseParameters;

interface SetupDatabaseParameters {
    connectionString: string;
    databaseName: string;
    collectionName: string;
    schemaPath: string;
    indexesPath: string;
    deleteAllDocuments: boolean;  // defaults to false
}

const setupDatabase = async ({
    connectionString,
    databaseName,
    collectionName,
    schemaPath,
    indexesPath,
    deleteAllDocuments = false,
}: SetupDatabaseParameters): Promise<void> => {
    try {
        const schema = JSON.parse(await cat(schemaPath));
        print(`Read schema from ${schemaPath}`);

        const indexes = JSON.parse(await cat(indexesPath));
        print(`Read indexes from ${indexesPath}`);

        // Connect to the default MongoDb instance.
        const connection: Connection = new Mongo(connectionString);
        print(`Connected to instance at ${connection['host']}`);

        // Get or create the database. (If it doesn't exist, it will be created.)
        const database = await connection.getDB(databaseName);
        print(`Connected to database "${database}"`);

        // If the collection already exists, drop all imported data from it and
        // apply the latest schema.
        let collection;
        if (
            (await database.getCollectionNames()).some(
                (c) => c == collectionName,
            )
        ) {
            collection = await database.getCollection(collectionName);
            if (deleteAllDocuments) {
                const results = await collection.remove({});
                print(
                    `Dropped all documents: (${results.nRemoved} total) 🗑️`,
                );
            }

            await database.runCommand({
                collMod: collectionName,
                validator: schema,
            });
            print(
                `Applied schema to existing collection "${collectionName}" 📑`,
            );
        } else {
            await database.createCollection(collectionName, {
                validator: schema,
            });
            print(`Created collection "${collectionName}" with schema 📑`);
            collection = await database.getCollection(collectionName);
        }

        print('Dropping all indexes 👇');
        await collection.dropIndexes();

        print('Creating indexes 👆');
        await database.runCommand({
            createIndexes: collectionName,
            indexes: indexes,
        });

        print('Done 👍');

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

declare let args: SetupDatabaseParameters;

interface SetupDatabaseParameters {
    databaseName: string;
    collectionName: string;
    schemaPath: string;
}

const setupDatabase = async ({
    databaseName,
    collectionName,
    schemaPath,
}: SetupDatabaseParameters): Promise<void> => {
    try {
        const schema = JSON.parse(await cat(schemaPath));
        print(`Read schema from ${schemaPath}`);

        // Connect to the default MongoDb instance.
        const connection: Connection = new Mongo();
        print(`Connected to instance at ${connection['host']}`);

        // Get or create the database. (If it doesn't exist, it will be created.)
        const database = await connection.getDB(databaseName);
        print(`Connected to database "${database}"`);

        // Either update the collection with the schema if it already exists, or
        // create the collection with the schema.
        let collection;
        if (
            (await database.getCollectionNames()).some(
                (c) => c == collectionName,
            )
        ) {
            // Drop existing data, if any.
            collection = await database.getCollection(collectionName);
            collection.remove({});
            print('Dropped existing data');

            // Update the collection with the schema validator.
            database.runCommand({
                collMod: collectionName,
                validator: schema,
            });
            print(`Applied schema to collection "${collectionName}"`);
        } else {
            await database.createCollection(collectionName, {
                validator: schema,
            });
            print(`Created collection "${collectionName}" with schema`);
        }

        // TODO(khmoran): Create indexes.
        collection =
            collection ?? (await database.getCollection(collectionName));

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

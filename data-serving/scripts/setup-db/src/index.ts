declare let args: SetupDatabaseParameters;

interface SetupDatabaseParameters {
    connectionString: string;
    databaseName: string;
    collectionName: string;
    schemaPath: string;
    textIndexPath: string;
    caseRefIndexPath: string;
    /** If not specified, deletes only imported documents. Defaults to false. */
    deleteAllDocuments: boolean;
}

const setupDatabase = async ({
    connectionString,
    databaseName,
    collectionName,
    schemaPath,
    textIndexPath,
    caseRefIndexPath,
    deleteAllDocuments = false,
}: SetupDatabaseParameters): Promise<void> => {
    try {
        const schema = JSON.parse(await cat(schemaPath));
        print(`Read schema from ${schemaPath}`);

        const textIndex = JSON.parse(await cat(textIndexPath));
        print(`Read text index from ${textIndexPath}`);

        const caseRefIndex = JSON.parse(await cat(caseRefIndexPath));
        print(`Read caseRef index from ${caseRefIndexPath}`);

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
            const query = deleteAllDocuments
                ? {}
                : { importedCase: { $exists: true, $ne: null } };
            const results = await collection.remove(query);
            print(
                `Dropped ${
                    deleteAllDocuments ? 'all' : 'imported'
                } documents (${results.nRemoved} total) 🗑️`,
            );

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

        print('Dropping indexes 👇');
        const textIndexName = `${collectionName}Idx`;
        await collection.dropIndex(textIndexName);
        const caseRefIndexName = `${collectionName}CaseRefIdx`;
        await collection.dropIndex(caseRefIndexName);

        print('Creating indexes 👆');
        await collection.createIndex(textIndex, { name: textIndexName });
        await collection.createIndex(caseRefIndex, {
            name: caseRefIndexName,
            unique: true,
            partialFilterExpression: {
                'caseReference.sourceEntryId': {
                    $exists: true,
                },
            },
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

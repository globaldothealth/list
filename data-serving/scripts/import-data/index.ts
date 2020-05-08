interface SetupDatabaseParameters {
    databaseName: string;
    collectionName: string;
    schemaPath: string;
    dataPath: string;
}

const applyValidator = async (
    database: Database,
    collectionName: string,
    schema: JSON,
): Promise<void> => {
    const result = await database.runCommand({
        collMod: collectionName,
        validator: schema,
    });

    if (result.ok != 1) {
        throw new Error(`Failed to apply validator: ${JSON.stringify(result)}`);
    }
};

const collectionExists = async (
    database: Database,
    collectionName: string,
): Promise<boolean> => {
    const collNames = await database.getCollectionNames();
    return !!collNames.find((c) => c == collectionName);
};

const createCollection = async (
    database: Database,
    collectionName: string,
    schema: JSON,
): Promise<void> => {
    const result = await database.createCollection(collectionName, {
        validator: schema,
    });

    if (result.ok != 1) {
        throw new Error(
            `Failed to create collection: ${JSON.stringify(result)}`,
        );
    }
};

const insertData = async (
    database: Database,
    collectionName: string,
    documents: JSON,
): Promise<InsertDataCommandResult> => {
    const result = (await database.runCommand({
        insert: collectionName,
        documents: documents,
        ordered: false, // Continue if one or more fails to insert.
    })) as InsertDataCommandResult;

    if (result.ok != 1) {
        throw new Error(`Failed to insert data: ${JSON.stringify(result)}`);
    }

    return result;
};

const readJson = async (path: string): Promise<JSON> => {
    const json = JSON.parse(await cat(path));

    if (json.length == 0) {
        throw new Error(`Empty file at "${path}"`);
    }

    return json;
};

const setupDatabase = async ({
    databaseName,
    collectionName,
    schemaPath,
    dataPath,
}: SetupDatabaseParameters): Promise<void> => {
    // Read the schema.
    try {
        const schema = await readJson(schemaPath);
        print('Read in schema from ${schemaPath}');

        const data = await readJson(dataPath);
        print(
            `Read in data from ${dataPath} with ${
                Object.keys(data).length
            } documents`,
        );

        // Connect to the default MongoDb instance.
        const connection: Connection = new Mongo();
        print(`Connected to instance at ${connection['host']}`);

        // If the database doesn't exist, it will be created.
        const database = await connection.getDB(databaseName);
        print(`Connected to database "${database}"`);

        // Either update the collection with the schema if it already exists, or
        // create the collection with the schema.
        if (await collectionExists(database, collectionName)) {
            print(`Collection "${collectionName}" already exists; updating`);

            await applyValidator(database, collectionName, schema);
            print(`Applied validator to "${collectionName}"`);
        } else {
            await createCollection(database, collectionName, schema);
            print(`Created collection "${collectionName}" with schema`);
        }

        // TODO(khmoran): Drop existing data.
        // TODO(khmoran): Create indexes.

        // Insert the data.
        const result = await insertData(database, collectionName, data);
        print(
            `Inserted ${result.n} docs; ${
                result.writeErrors ? result.writeErrors.length : 0
            } failed`,
        );

        // Print any errors.
        if (result.writeErrors && result.writeErrors.length > 0) {
            printjson(result.writeErrors);
        }

        print('Thank you for joining us 💾');
    } catch (e) {
        printjson(e);
        quit();
    }
};

setupDatabase({
    databaseName: 'covid19',
    collectionName: 'cases',
    schemaPath: './../../data-service/schemas/cases.schema.json',
    dataPath: './../../samples/cases.json',
});

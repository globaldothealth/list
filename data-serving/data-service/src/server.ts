import app from './index';
import DbClient from './common/db-client';

// Start Express server.
const server = app.listen(app.get('port'), async () => {
    console.log('App running at http://localhost:%d.', app.get('port'));
    console.log('  Press CTRL-C to stop\n');

    try {
        if (!process.env.DB_CONNECTION_STRING) {
            throw new Error('DB_CONNECTION_STRING not specified');
        } else if (!process.env.DB_NAME) {
            throw new Error('DB_NAME not specified');
        } else if (!process.env.DB_COLLECTION) {
            throw new Error('DB_COLLECTION not specified');
        }

        console.log(
            `  Connecting to instance ${process.env.DB_CONNECTION_STRING}
               with db ${process.env.DB_NAME}
               and collection ${process.env.DB_COLLECTION}`,
        );

        const client = new DbClient(process.env.DB_CONNECTION_STRING);
        await client.connect();
        console.log('  Connected to the database!');

        const db = client.db(process.env.DB_NAME);
        const docs = await db
            .collection(process.env.DB_COLLECTION)
            .find()
            .toArray();
        console.log(`    Found ${docs.length} records`);
    } catch (e) {
        console.log('  Failed to connect to the database. :(', e);
    }
});

export default server;

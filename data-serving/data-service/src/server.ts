import app from './index';
import DbClient from './common/db-client';


// Start Express server.
const server = app.listen(app.get('port'), async () => {
    console.log('App running at http://localhost:%d.', app.get('port'));
    console.log('  Press CTRL-C to stop\n');

    try {
        const client = await DbClient.connect();
        console.log('  Connected to the database!');

        const devDb = client.db('dev');
        const docs = await devDb.collection('covid19').find().toArray();
        console.log(`    Found ${docs.length} records`);
    } catch (e) {
        console.log('  Failed to connect to the database. :(', e);
    }
});

export default server;

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import DbClient from './common/db-client';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as caseController from './controllers/case';

const app = express();

dotenv.config();

// Express configuration.
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure app routes.
app.get('/', homeController.get);
app.get('/cases/:id', caseController.get);
app.get('/cases', caseController.list);
app.post('/cases', caseController.create);
app.put('/cases/:id', caseController.update);
app.delete('/cases/:id', caseController.del);

(async () => {
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
        console.error('  Failed to connect to the database. :(', e);
    }
})();

export default app;

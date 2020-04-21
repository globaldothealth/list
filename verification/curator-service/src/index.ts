import express from 'express';
import dotenv from 'dotenv';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import { Sources } from './controllers/sources';
import { MongoClient } from 'mongodb';
import { MongoStore, Store, MemStore } from './storage/store';

const app = express();

dotenv.config();

// Express configuration.
app.set('port', process.env.PORT || 3001);

// Configure frontend app routes.
app.get('/', homeController.index);

const apiRouter = express.Router();
(async (): Promise<void> => {
    let store: Store;
    if (process.env.NODE_ENV === 'test') {
        console.log('Running in test env, using in memory store');
        store = new MemStore();
    } else {
        const client = new MongoClient(
            process.env.MONGO_URL || 'mongodb://localhost:27017',
            {
                useUnifiedTopology: true,
            },
        );

        try {
            await client.connect();
            console.log('Connected correctly to server');

            const db = client.db(process.env.MONGO_DB);
            store = new MongoStore(db);
        } catch (err) {
            console.error(err.stack);
            return;
        }
    }
    const sources = new Sources(store);

    // Configure API app routes.
    apiRouter.get('/sources/', sources.list);
    apiRouter.get('/sources/:id', sources.get);
    apiRouter.post('/sources/', sources.create);
    apiRouter.put('/sources/:id', sources.update);
    apiRouter.delete('/sources/:id', sources.del);
    app.use('/api', apiRouter);

    // TODO: when to close connection? is there an app.cleanup kind of deferrable?
})();
export default app;

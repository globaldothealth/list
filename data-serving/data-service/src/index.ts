import * as caseController from './controllers/case';
// Controllers (route handlers).
import * as homeController from './controllers/home';

import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import validateEnv from './util/validate-env';

const app = express();

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure app routes.
app.get('/', homeController.get);
const apiRouter = express.Router();
apiRouter.get('/cases/:id([a-z0-9]{24})', caseController.get);
apiRouter.get('/cases/', caseController.list);
apiRouter.post('/cases/', caseController.create);
apiRouter.put('/cases/:id([a-z0-9]{24})', caseController.update);
apiRouter.delete('/cases/:id([a-z0-9]{24})', caseController.del);
app.use('/api', apiRouter);

(async (): Promise<void> => {
    try {
        console.log(`  Connecting to instance ${env.DB_CONNECTION_STRING}`);

        await mongoose.connect(env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        console.log('  Connected to the database!');
    } catch (e) {
        console.error('  Failed to connect to the database. :(', e);
    }
})();

export default app;

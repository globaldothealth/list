import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import validateEnv from './util/validate-env';
import mongoose from 'mongoose';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as caseController from './controllers/case';

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
apiRouter.get('/cases/:id', caseController.get);
apiRouter.get('/cases/', caseController.list);
apiRouter.post('/cases/', caseController.create);
apiRouter.put('/cases/:id', caseController.update);
apiRouter.delete('/cases/:id', caseController.del);
app.use('/api', apiRouter);

(async (): Promise<void> => {
    try {
        console.log(`  Connecting to instance ${env.DB_CONNECTION_STRING}`);

        await mongoose.connect(env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('  Connected to the database!');
    } catch (e) {
        console.error('  Failed to connect to the database. :(', e);
    }
})();

export default app;

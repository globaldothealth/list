import * as caseController from './controllers/case';
import * as homeController from './controllers/home';

import { Request, Response } from 'express';
import {
    createBatchCaseRevisions,
    createCaseRevision,
    setBatchRevisionMetadata,
    setRevisionMetadata,
} from './controllers/preprocessor';

import { Case } from './model/case';
import { OpenApiValidator } from 'express-openapi-validator';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import expressStatusMonitor from 'express-status-monitor';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './util/validate-env';

const app = express();

if (process.env.NODE_ENV !== 'test') {
    app.use(expressStatusMonitor());
}

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
    }),
);

// Configure app routes.
app.get('/', homeController.get);

// API documentation.
const swaggerDocument = YAML.load('./api/openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic health check handler.
app.get('/health', (req: Request, res: Response) => {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting.
    // https://mongoosejs.com/docs/api.html#connection_Connection-readyState
    if (mongoose.connection.readyState == 1) {
        res.sendStatus(200);
        return;
    }
    // Unavailable, this is wrong as per HTTP RFC, 503 would mean that we
    // couldn't determine if the backend was healthy or not but honestly
    // this is simple enough that it makes sense.
    return res.sendStatus(503);
});

// API validation.
new OpenApiValidator({
    apiSpec: './api/openapi.yaml',
    validateResponses: true,
})
    .install(app)
    .then(() => {
        const apiRouter = express.Router();
        apiRouter.get('/cases/:id([a-z0-9]{24})', caseController.get);
        apiRouter.get('/cases', caseController.list);
        apiRouter.get('/cases/symptoms', caseController.listSymptoms);
        apiRouter.get(
            '/cases/placesOfTransmission',
            caseController.listPlacesOfTransmission,
        );
        apiRouter.get('/cases/occupations', caseController.listOccupations);
        apiRouter.post('/cases', setRevisionMetadata, caseController.create);
        apiRouter.post('/cases/batchValidate', caseController.batchValidate);
        apiRouter.post(
            '/cases/batchUpsert',
            setBatchRevisionMetadata,
            createBatchCaseRevisions,
            caseController.batchUpsert,
        );
        apiRouter.put(
            '/cases',
            setRevisionMetadata,
            createCaseRevision,
            caseController.upsert,
        );
        apiRouter.put(
            '/cases/:id([a-z0-9]{24})',
            setRevisionMetadata,
            createCaseRevision,
            caseController.update,
        );
        apiRouter.delete('/cases', caseController.batchDel);
        apiRouter.delete('/cases/:id([a-z0-9]{24})', caseController.del);
        app.use('/api', apiRouter);
    });

(async (): Promise<void> => {
    try {
        // Connect to MongoDB.
        // MONGO_URL is provided by the in memory version of jest-mongodb.
        // DB_CONNECTION_STRING is what we use in prod.
        const mongoURL = process.env.MONGO_URL || env.DB_CONNECTION_STRING;
        console.log(
            'Connecting to MongoDB instance',
            // Print only after username and password to not log them.
            mongoURL.substring(mongoURL.indexOf('@')),
        );

        await mongoose.connect(mongoURL, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        await Case.ensureIndexes();
    } catch (e) {
        console.error('Failed to connect to the database. :(', e);
        process.exit(1);
    }
})();

export default app;

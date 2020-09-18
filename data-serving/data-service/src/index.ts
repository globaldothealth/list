import * as cases from './controllers/case';
import * as homeController from './controllers/home';

import { Request, Response } from 'express';
import {
    batchDeleteCheckThreshold,
    batchUpsertDropUnchangedCases,
    createBatchDeleteCaseRevisions,
    createBatchUpdateCaseRevisions,
    createBatchUpsertCaseRevisions,
    createCaseRevision,
    findCasesToUpdate,
    setBatchUpdateRevisionMetadata,
    setBatchUpsertFields,
    setRevisionMetadata,
} from './controllers/preprocessor';

import { Case } from './model/case';
import FakeGeocoder from './geocoding/fake';
import GeocodeSuggester from './geocoding/suggest';
import { Geocoder } from './geocoding/geocoder';
import MapboxGeocoder from './geocoding/mapbox';
import { OpenApiValidator } from 'express-openapi-validator';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import expressStatusMonitor from 'express-status-monitor';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './util/validate-env';
import { logger } from './util/logger';

const app = express();

if (process.env.NODE_ENV !== 'test') {
    app.use(expressStatusMonitor());
}

dotenv.config();
const env = validateEnv();

if (env.SERVICE_ENV !== 'prod') {
    require('longjohn');
}

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
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        // Hide the useless "SWAGGER" black bar at the top.
        customCss: '.swagger-ui .topbar { display: none }',
        // Make it look nicer.
        customCssUrl:
            'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.1/themes/3.x/theme-material.css',
    }),
);

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
        // Chain geocoders so that during dev/integration tests we can use the fake one.
        // It might also just be useful to have various geocoders plugged-in at some point.
        const geocoders = new Array<Geocoder>();
        if (env.ENABLE_FAKE_GEOCODER) {
            logger.info('Using fake geocoder');
            const fakeGeocoder = new FakeGeocoder();
            apiRouter.post('/geocode/seed', fakeGeocoder.seed);
            apiRouter.post('/geocode/clear', fakeGeocoder.clear);
            geocoders.push(fakeGeocoder);
        }
        if (env.MAPBOX_TOKEN !== '') {
            logger.info('Using mapbox geocoder');
            geocoders.push(
                new MapboxGeocoder(
                    env.MAPBOX_TOKEN,
                    env.MAPBOX_PERMANENT_GEOCODE
                        ? 'mapbox.places-permanent'
                        : 'mapbox.places',
                ),
            );
        }
        const caseController = new cases.CasesController(geocoders);

        apiRouter.get('/cases/:id([a-z0-9]{24})', caseController.get);
        apiRouter.get('/cases', caseController.list);
        apiRouter.get('/cases/symptoms', cases.listSymptoms);
        apiRouter.get(
            '/cases/placesOfTransmission',
            cases.listPlacesOfTransmission,
        );
        apiRouter.get('/cases/occupations', cases.listOccupations);
        apiRouter.post('/cases', setRevisionMetadata, caseController.create);
        apiRouter.post('/cases/download', caseController.download);
        apiRouter.post(
            '/cases/batchUpsert',
            caseController.batchGeocode,
            batchUpsertDropUnchangedCases,
            setBatchUpsertFields,
            createBatchUpsertCaseRevisions,
            caseController.batchUpsert,
        );
        apiRouter.put(
            '/cases',
            setRevisionMetadata,
            createCaseRevision,
            caseController.upsert,
        );
        apiRouter.post(
            '/cases/batchUpdate',
            setBatchUpdateRevisionMetadata,
            createBatchUpdateCaseRevisions,
            caseController.batchUpdate,
        );
        apiRouter.post(
            '/cases/batchUpdateQuery',
            findCasesToUpdate,
            setBatchUpdateRevisionMetadata,
            createBatchUpdateCaseRevisions,
            caseController.batchUpdate,
        );
        apiRouter.put(
            '/cases/:id([a-z0-9]{24})',
            setRevisionMetadata,
            createCaseRevision,
            caseController.update,
        );
        apiRouter.delete(
            '/cases',
            batchDeleteCheckThreshold,
            createBatchDeleteCaseRevisions,
            caseController.batchDel,
        );
        apiRouter.delete(
            '/cases/:id([a-z0-9]{24})',
            createCaseRevision,
            caseController.del,
        );

        // Suggest locations based on the request's "q" query param.
        const geocodeSuggester = new GeocodeSuggester(geocoders);
        apiRouter.get('/geocode/suggest', geocodeSuggester.suggest);

        app.use('/api', apiRouter);
    });

(async (): Promise<void> => {
    try {
        // Connect to MongoDB.
        // MONGO_URL is provided by the in memory version of jest-mongodb.
        // DB_CONNECTION_STRING is what we use in prod.
        const mongoURL = process.env.MONGO_URL || env.DB_CONNECTION_STRING;
        logger.info(
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
        logger.error('Failed to connect to the database. :(', e);
        process.exit(1);
    }
})();

export default app;

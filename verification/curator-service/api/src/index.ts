import * as usersController from './controllers/users';

import { AuthController, mustHaveAnyRole } from './controllers/auth';
import { NextFunction, Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';

import AwsEventsClient from './clients/aws-events-client';
import AwsLambdaClient from './clients/aws-lambda-client';
import CasesController from './controllers/cases';
import FakeGeocoder from './geocoding/fake';
import GeocodeSuggester from './geocoding/suggest';
import { Geocoder } from './geocoding/geocoder';
import MapboxGeocoder from './geocoding/mapbox';
import { OpenApiValidator } from 'express-openapi-validator';
import SourcesController from './controllers/sources';
import UploadsController from './controllers/uploads';
import { ValidationError } from 'express-openapi-validator/dist/framework/types';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import expressStatusMonitor from 'express-status-monitor';
import mongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './util/validate-env';

const app = express();

if (process.env.NODE_ENV !== 'test') {
    app.use(expressStatusMonitor());
}

app.use(bodyParser.json({ limit: '50mb' }));
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
    }),
);

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);

// Connect to MongoDB.
// MONGO_URL is provided by the in memory version of jest-mongodb.
// DB_CONNECTION_STRING is what we use in prod.
const mongoURL = process.env.MONGO_URL || env.DB_CONNECTION_STRING;
console.log(
    'Connecting to MongoDB instance',
    // Print only after username and password to not log them.
    mongoURL.substring(mongoURL.indexOf('@')),
);

mongoose
    .connect(mongoURL, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log('Connected to the database');
    })
    .catch((e) => {
        console.error('Failed to connect to DB', e);
        process.exit(1);
    });

// Store session info in MongoDB.
const MongoStore = mongo(session);
// Configure authentication.
app.use(cookieParser());
const sess: SessionOptions = {
    secret: env.SESSION_COOKIE_KEY,
    // MongoStore implements touch() so we don't need resave.
    // Cf. https://github.com/expressjs/session#resave.
    resave: false,
    // Chosing false is useful for login sessions which is what we want.
    // https://github.com/expressjs/session#saveuninitialized
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        secret: env.SESSION_COOKIE_KEY,
    }),
    cookie: {
        sameSite: 'strict',
    },
};
if (process.env.NODE_ENV === 'production') {
    if (sess.cookie) {
        app.set('trust proxy', 1); // trust first proxy
        sess.cookie.secure = true;
    }
}
app.use(session(sess));
const authController = new AuthController(env.AFTER_LOGIN_REDIRECT_URL);
authController.configurePassport(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
);
if (env.ENABLE_LOCAL_AUTH) {
    authController.configureLocalAuth();
}
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authController.router);

// Configure connection to AWS services.
const awsLambdaClient = new AwsLambdaClient(
    env.GLOBAL_RETRIEVAL_FUNCTION_ARN,
    env.SERVICE_ENV,
    env.AWS_SERVICE_REGION,
);
const awsEventsClient = new AwsEventsClient(
    env.AWS_SERVICE_REGION,
    awsLambdaClient,
    env.SERVICE_ENV,
);

// API validation.
new OpenApiValidator({
    apiSpec: './openapi/openapi.yaml',
    validateResponses: true,
})
    .install(app)
    .then(() => {
        // Configure curator API routes.
        const apiRouter = express.Router();

        // Configure sources controller.
        const sourcesController = new SourcesController(
            awsLambdaClient,
            awsEventsClient,
            env.GLOBAL_RETRIEVAL_FUNCTION_ARN,
        );
        apiRouter.get(
            '/sources',
            mustHaveAnyRole(['curator']),
            sourcesController.list,
        );
        apiRouter.get(
            '/sources/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            sourcesController.get,
        );
        apiRouter.post(
            '/sources',
            mustHaveAnyRole(['curator']),
            sourcesController.create,
        );
        apiRouter.put(
            '/sources/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            sourcesController.update,
        );
        apiRouter.delete(
            '/sources/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            sourcesController.del,
        );
        apiRouter.post(
            '/sources/:id([a-z0-9]{24})/retrieve',
            mustHaveAnyRole(['curator']),
            sourcesController.retrieve,
        );
        apiRouter.get(
            '/sources/parsers',
            mustHaveAnyRole(['curator']),
            sourcesController.listParsers,
        );

        // Configure uploads controller.
        const uploadsController = new UploadsController();
        apiRouter.get(
            '/sources/uploads',
            mustHaveAnyRole(['curator']),
            uploadsController.list,
        );
        apiRouter.post(
            '/sources/:sourceId([a-z0-9]{24})/uploads',
            mustHaveAnyRole(['curator']),
            uploadsController.create,
        );
        apiRouter.put(
            '/sources/:sourceId([a-z0-9]{24})/uploads/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            uploadsController.update,
        );

        // Chain geocoders so that during dev/integration tests we can use the fake one.
        // It might also just be useful to have various geocoders plugged-in at some point.
        const geocoders = new Array<Geocoder>();
        if (env.ENABLE_FAKE_GEOCODER) {
            console.log('Using fake geocoder');
            const fakeGeocoder = new FakeGeocoder();
            apiRouter.post('/geocode/seed', fakeGeocoder.seed);
            apiRouter.post('/geocode/clear', fakeGeocoder.clear);
            geocoders.push(fakeGeocoder);
        }
        if (env.MAPBOX_TOKEN !== '') {
            console.log('Using mapbox geocoder');
            geocoders.push(
                new MapboxGeocoder(
                    env.MAPBOX_TOKEN,
                    env.MAPBOX_PERMANENT_GEOCODE
                        ? 'mapbox.places-permanent'
                        : 'mapbox.places',
                ),
            );
        }

        // Configure cases controller proxying to data service.
        const casesController = new CasesController(
            env.DATASERVER_URL,
            geocoders,
        );
        apiRouter.get(
            '/cases',
            mustHaveAnyRole(['reader', 'curator', 'admin']),
            casesController.list,
        );
        apiRouter.get(
            '/cases/symptoms',
            mustHaveAnyRole(['reader', 'curator']),
            casesController.listSymptoms,
        );
        apiRouter.get(
            '/cases/placesOfTransmission',
            mustHaveAnyRole(['reader', 'curator']),
            casesController.listPlacesOfTransmission,
        );
        apiRouter.get(
            '/cases/occupations',
            mustHaveAnyRole(['reader', 'curator']),
            casesController.listOccupations,
        );
        apiRouter.get(
            '/cases/:id([a-z0-9]{24})',
            mustHaveAnyRole(['reader', 'curator', 'admin']),
            casesController.get,
        );
        apiRouter.post(
            '/cases',
            mustHaveAnyRole(['curator']),
            casesController.create,
        );
        apiRouter.post(
            '/cases/download',
            mustHaveAnyRole(['reader', 'curator', 'admin']),
            casesController.download,
        );
        apiRouter.post(
            '/cases/batchUpsert',
            mustHaveAnyRole(['curator']),
            casesController.batchUpsert,
        );
        apiRouter.put(
            '/cases',
            mustHaveAnyRole(['curator']),
            casesController.upsert,
        );
        apiRouter.post(
            '/cases/batchUpdate',
            mustHaveAnyRole(['curator']),
            casesController.batchUpdate,
        );
        apiRouter.post(
            '/cases/batchUpdateQuery',
            mustHaveAnyRole(['curator']),
            casesController.batchUpdateQuery,
        );
        apiRouter.put(
            '/cases/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            casesController.update,
        );
        apiRouter.delete(
            '/cases',
            mustHaveAnyRole(['curator', 'admin']),
            casesController.batchDel,
        );
        apiRouter.delete(
            '/cases/:id([a-z0-9]{24})',
            mustHaveAnyRole(['curator']),
            casesController.del,
        );

        // Configure users controller.
        apiRouter.get('/users', usersController.list);
        apiRouter.put('/users/:id', usersController.updateRoles);
        apiRouter.get('/users/roles', usersController.listRoles);

        // Suggest locations based on the request's "q" query param.
        const geocodeSuggester = new GeocodeSuggester(geocoders);
        apiRouter.get(
            '/geocode/suggest',
            mustHaveAnyRole(['curator']),
            geocodeSuggester.suggest,
        );

        app.use('/api', apiRouter);

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

        // API documentation.
        const swaggerDocument = YAML.load('./openapi/openapi.yaml');
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

        // Register error handler to format express validator errors otherwise
        // a complete HTML document is sent as the error output.
        app.use(
            (
                err: ValidationError,
                req: Request,
                res: Response,
                next: NextFunction,
            ) => {
                res.status(err.status || 500).json({
                    message: err.message,
                    errors: err.errors,
                });
            },
        );

        // Serve static UI content if static directory was specified.
        if (env.STATIC_DIR) {
            console.log('Serving static files from', env.STATIC_DIR);
            app.use(express.static(env.STATIC_DIR));
            // Send index to any unmatched route.
            // This must be the LAST handler installed on the app.
            // All subsequent handlers will be ignored.
            app.get('*', (req: Request, res: Response) => {
                res.sendFile(path.join(env.STATIC_DIR, 'index.html'));
            });
        }
    })
    .catch((e) => {
        console.error('Failed to install OpenAPI validator:', e);
        process.exit(1);
    });

export default app;

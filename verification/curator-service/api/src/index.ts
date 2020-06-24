import * as usersController from './controllers/users';

import { AuthController, mustHaveAnyRole } from './controllers/auth';
import { Request, Response } from 'express';
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
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import mongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './util/validate-env';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    resave: true,
    saveUninitialized: true,
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
const awsLambdaClient = new AwsLambdaClient(env.AWS_SERVICE_REGION);
const awsEventsClient = new AwsEventsClient(
    env.AWS_SERVICE_REGION,
    awsLambdaClient,
);

// Configure curator API routes.
const apiRouter = express.Router();

// Configure sources controller.
const sourcesController = new SourcesController(
    awsEventsClient,
    env.GLOBAL_RETRIEVAL_FUNCTION_ARN,
);
apiRouter.get(
    '/sources',
    mustHaveAnyRole(['reader', 'curator']),
    sourcesController.list,
);
apiRouter.get(
    '/sources/:id([a-z0-9]{24})',
    mustHaveAnyRole(['reader', 'curator']),
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
const casesController = new CasesController(env.DATASERVER_URL, geocoders);
apiRouter.get(
    '/cases',
    mustHaveAnyRole(['reader', 'curator']),
    casesController.list,
);
apiRouter.get(
    '/cases/:id([a-z0-9]{24})',
    mustHaveAnyRole(['reader', 'curator']),
    casesController.get,
);
apiRouter.post('/cases', mustHaveAnyRole(['curator']), casesController.create);
apiRouter.put('/cases', mustHaveAnyRole(['curator']), casesController.upsert);
apiRouter.put(
    '/cases/:id([a-z0-9]{24})',
    mustHaveAnyRole(['curator']),
    casesController.update,
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API validation.
new OpenApiValidator({
    apiSpec: './openapi/openapi.yaml',
    validateResponses: true,
}).install(app);

// Serve static UI content if static directory was specified.
if (env.STATIC_DIR) {
    console.log('Serving static files from', env.STATIC_DIR);
    app.use(express.static(env.STATIC_DIR));
    // Send index to any unmatched route.
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(env.STATIC_DIR, 'index.html'));
    });
}

export default app;

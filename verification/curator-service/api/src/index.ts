import * as usersController from './controllers/users';

import { AuthController, mustHaveAnyRole } from './controllers/auth';
import { Request, Response } from 'express';

import AwsEventsClient from './clients/aws-events-client';
import CasesController from './controllers/cases';
import SourcesController from './controllers/sources';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import mongo from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import path from 'path';
import session from 'express-session';
import validateEnv from './util/validate-env';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);

// Connect to MongoDB.
console.log(
    'Connecting to MongoDB instance',
    // Print only after username and password to not log them.
    env.DB_CONNECTION_STRING.substring(env.DB_CONNECTION_STRING.indexOf('@')),
);

mongoose
    .connect(env.DB_CONNECTION_STRING, {
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

// Configure authentication.
app.use(cookieParser());
// Store session info in MongoDB.
const MongoStore = mongo(session);
app.use(
    session({
        secret: env.SESSION_COOKIE_KEY,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            secret: env.SESSION_COOKIE_KEY,
        }),
    }),
);
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
const awsEventsClient = new AwsEventsClient(
    env.GLOBAL_RETRIEVAL_FUNCTION_ARN,
    env.AWS_SERVICE_REGION,
);

// Configure curator API routes.
const apiRouter = express.Router();

// Configure sources controller.
const sourcesController = new SourcesController(awsEventsClient);
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

// Configure cases controller proxying to data service.
const casesController = new CasesController(env.DATASERVER_URL);
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

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as sourcesController from './controllers/sources';

import { router as authRouter, configurePassport } from './controllers/auth';

import { CasesController } from './controllers/cases';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import validateEnv from './util/validate-env';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);

// We run the frontend on another port, support queries from all origins.
// TODO: This will need to be tweaked in production.
app.use(cors());

// Configure authentication.
app.use(cookieParser());
app.use(
    session({
        secret: env.SESSION_COOKIE_KEY,
        resave: true,
        saveUninitialized: true,
    }),
);
configurePassport(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRouter);

// Configure frontend app routes.
app.get('/', homeController.index);

// Configure cases controller proxying to data service.
const casesController = new CasesController(env.DATASERVER_URL);

// Configure curator API routes.
const apiRouter = express.Router();
apiRouter.get('/sources', sourcesController.list);
apiRouter.get('/sources/:id([a-z0-9]{24})', sourcesController.get);
apiRouter.post('/sources', sourcesController.create);
apiRouter.put('/sources/:id([a-z0-9]{24})', sourcesController.update);
apiRouter.delete('/sources/:id([a-z0-9]{24})', sourcesController.del);

apiRouter.get('/cases', casesController.list);
apiRouter.get('/cases/:id([a-z0-9]{24})', casesController.get);
apiRouter.post('/cases', casesController.create);
apiRouter.put('/cases/:id([a-z0-9]{24})', casesController.update);
apiRouter.delete('/cases/:id([a-z0-9]{24})', casesController.del);

app.use('/api', apiRouter);

// Connect to MongoDB.
(async (): Promise<void> => {
    try {
        console.log('Connecting to instance', env.DB_CONNECTION_STRING);

        await mongoose.connect(env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        console.log('Connected to the database');
    } catch (e) {
        console.error('Failed to connect to DB', e);
    }
})();
export default app;

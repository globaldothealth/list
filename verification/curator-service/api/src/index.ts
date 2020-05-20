import * as sourcesController from './controllers/sources';

import { Request, Response } from 'express';

import { AuthController } from './controllers/auth';
import CasesController from './controllers/cases';
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
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authController.router);

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

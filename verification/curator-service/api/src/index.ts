import * as usersController from './controllers/users';

import {
    AuthController,
    authenticateByAPIKey,
    mustBeAuthenticated,
    mustHaveAnyRole,
} from './controllers/auth';
import { NextFunction, Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';

import AwsBatchClient from './clients/aws-batch-client';
import AwsLambdaClient from './clients/aws-lambda-client';
import CasesController from './controllers/cases';
import EmailClient from './clients/email-client';
import GeocodeProxy from './controllers/geocode';
import { middleware as OpenApiValidatorMiddleware } from 'express-openapi-validator';
import SourcesController from './controllers/sources';
import UploadsController from './controllers/uploads';
import { ValidationError } from 'express-openapi-validator/dist/framework/types';
import YAML from 'yamljs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './util/validate-env';
import { logger } from './util/logger';
import S3 from 'aws-sdk/clients/s3';
import cors from 'cors';
import db, { connectToDatabase } from './model/database';
import winston from 'winston';
import expressWinston from 'express-winston';

async function makeApp() {
    const app = express();
    // log all non-200 responses: this needs to come _before_ any middleware or routers
    app.use(
        expressWinston.logger({
            transports: [new winston.transports.Console()],
            format: winston.format.json(),
            /* don't log user info. We don't get user cookies or passwords in this service, so it's just
             * belt-and-braces to ensure we don't log the API key if it was forwarded from the curator service.
             */
            headerBlacklist: ['X-Api-Key'],
        }),
    );

    app.use(express.json({ limit: '50mb', type: 'application/json' }));
    app.use(
        express.urlencoded({
            limit: '50mb',
            extended: true,
        }),
    );

    dotenv.config();
    const env = validateEnv();

    const deployment_envs = ['dev', 'qa', 'prod'];
    if (!deployment_envs.includes(env.SERVICE_ENV)) {
        require('longjohn');
    }

    // Express configuration.
    app.set('port', env.PORT);

    // Connect to MongoDB.
    // MONGO_URL is provided by the in memory version of jest-mongodb.
    // DB_CONNECTION_STRING is what we use in prod.
    const mongoURL = process.env.MONGO_URL || env.DB_CONNECTION_STRING;
    const mongoClient = await connectToDatabase(mongoURL);

    // Store session info in MongoDB.
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
        store: MongoStore.create({
            client: mongoClient,
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

    const awsBatchClient = new AwsBatchClient(
        env.SERVICE_ENV,
        env.LOCALSTACK_URL,
        env.JOB_QUEUE_ARN,
        env.AWS_SERVICE_REGION,
    );
    // Configure connection to AWS services.
    const awsLambdaClient = new AwsLambdaClient(
        env.SERVICE_ENV,
        env.LOCALSTACK_URL,
        env.AWS_SERVICE_REGION,
    );

    let s3Client;
    if (env.SERVICE_ENV == 'locale2e') {
        s3Client = new S3({
            region: env.AWS_SERVICE_REGION,
            endpoint: env.LOCALSTACK_URL,
            s3ForcePathStyle: true,
        });
    } else {
        s3Client = new S3({
            region: env.AWS_SERVICE_REGION,
            signatureVersion: 'v4',
        });
    }

    // Configure Email Client
    const emailClient = new EmailClient(
        env.SERVICE_ENV,
        env.AWS_ACCESS_KEY_ID,
        env.AWS_SECRET_ACCESS_KEY,
        env.AWS_SERVICE_REGION,
        env.EMAIL_USER_ADDRESS,
    ).initialize();

    // Configure auth controller
    const authController = new AuthController(
        env.SERVICE_ENV,
        env.AFTER_LOGIN_REDIRECT_URL,
        awsLambdaClient,
        emailClient,
    );
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

    // API validation.
    app.use(
        OpenApiValidatorMiddleware({
            apiSpec: './openapi/openapi.yaml',
            validateResponses: true,
        }),
    );

    // Configure curator API routes.
    const apiRouter = express.Router();

    // Configure sources controller.
    const sourcesController = new SourcesController(
        emailClient,
        awsBatchClient,
        env.DATASERVER_URL,
    );
    apiRouter.get(
        '/sources',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.list,
    );
    apiRouter.get(
        '/acknowledgment-sources',
        sourcesController.listSourcesForTable,
    );
    apiRouter.get(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.get,
    );
    apiRouter.post(
        '/sources',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.create,
    );
    apiRouter.put(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.update,
    );
    apiRouter.delete(
        '/sources/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.del,
    );
    apiRouter.post(
        '/sources/:id([a-z0-9]{24})/retrieve',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.retrieve,
    );
    apiRouter.get(
        '/sources/parsers',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        sourcesController.listParsers,
    );

    // Configure uploads controller.
    const uploadsController = new UploadsController(emailClient);
    apiRouter.get(
        '/sources/uploads',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        uploadsController.list,
    );
    apiRouter.post(
        '/sources/:sourceId([a-z0-9]{24})/uploads',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        uploadsController.create,
    );
    apiRouter.put(
        '/sources/:sourceId([a-z0-9]{24})/uploads/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        uploadsController.update,
    );

    // Configure cases controller proxying to data service.
    const casesController = new CasesController(
        env.DATASERVER_URL,
        env.COMPLETE_DATA_BUCKET,
        env.COUNTRY_DATA_BUCKET,
        s3Client);
    apiRouter.get(
        '/cases',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.list,
    );
    apiRouter.get(
        '/cases/symptoms',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.listSymptoms,
    );
    apiRouter.get(
        '/cases/placesOfTransmission',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.listPlacesOfTransmission,
    );
    apiRouter.get(
        '/cases/occupations',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.listOccupations,
    );
    apiRouter.get(
        '/cases/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.get,
    );
    apiRouter.post(
        '/cases/getDownloadLink',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.getDownloadLink,
    );
    apiRouter.post(
        '/cases',
        mustHaveAnyRole(['curator']),
        casesController.create,
    );
    apiRouter.post(
        '/cases/download',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.download,
    );
    apiRouter.post(
        '/cases/downloadAsync',
        authenticateByAPIKey,
        mustBeAuthenticated,
        casesController.downloadAsync,
    );
    apiRouter.post(
        '/cases/batchUpsert',
        authenticateByAPIKey,
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
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.batchUpdate,
    );
    apiRouter.post(
        '/cases/batchUpdateQuery',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.batchUpdateQuery,
    );
    apiRouter.post(
        '/cases/batchStatusChange',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.batchStatusChange,
    );
    apiRouter.put(
        '/cases/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.update,
    );
    apiRouter.delete(
        '/cases',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator', 'admin']),
        casesController.batchDel,
    );
    apiRouter.delete(
        '/cases/:id([a-z0-9]{24})',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        casesController.del,
    );

    // Configure users controller.
    apiRouter.get(
        '/users',
        authenticateByAPIKey,
        mustHaveAnyRole(['admin']),
        usersController.list,
    );
    apiRouter.put(
        '/users/:id',
        authenticateByAPIKey,
        mustHaveAnyRole(['admin']),
        usersController.updateRoles,
    );
    apiRouter.get(
        '/users/roles',
        authenticateByAPIKey,
        mustHaveAnyRole(['admin']),
        usersController.listRoles,
    );

    const geocodeProxy = new GeocodeProxy(env.LOCATION_SERVICE_URL);

    // Forward geocode requests to location service.
    apiRouter.get(
        '/geocode/suggest',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        geocodeProxy.suggest,
    );
    apiRouter.get(
        '/geocode/convertUTM',
        authenticateByAPIKey,
        mustHaveAnyRole(['curator']),
        geocodeProxy.convertUTM,
    );
    apiRouter.get(
        '/geocode/countryNames',
        authenticateByAPIKey,
        mustBeAuthenticated,
        geocodeProxy.countryNames,
    );
    apiRouter.post('/geocode/seed', geocodeProxy.seed);
    apiRouter.post('/geocode/clear', geocodeProxy.clear);

    // Forward excluded case IDs fetching to data service
    apiRouter.get('/excludedCaseIds', casesController.listExcludedCaseIds);

    app.use('/api', apiRouter);

    // Basic health check handler.
    app.get('/health', async (req: Request, res: Response) => {
        try {
            await db().command({ ping: 1 });
            res.sendStatus(200);
        } catch (err) {
            const error = err as Error;
            logger.error('error pinging db for health check');
            logger.error(error);
            // Unavailable, this is wrong as per HTTP RFC, 503 would mean that we
            // couldn't determine if the backend was healthy or not but honestly
            // this is simple enough that it makes sense.
            return res.sendStatus(503);
        }
    });

    // version handler.
    app.get('/version', cors(), (req: Request, res: Response) => {
        res.status(200).send(env.CURATOR_VERSION);
    });

    app.get('/diseaseName', (req: Request, res: Response) => {
        res.status(200).send(env.DISEASE_NAME);
    });

    // get current environment
    app.get('/env', (req: Request, res: Response) => {
        res.status(200).send(env.SERVICE_ENV);
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        logger.info('Serving static files from', env.STATIC_DIR);
        app.use(express.static(env.STATIC_DIR));
        // Send index to any unmatched route.
        // This must be the LAST handler installed on the app.
        // All subsequent handlers will be ignored.
        app.get('*', (req: Request, res: Response) => {
            res.sendFile(path.join(env.STATIC_DIR, 'index.html'));
        });
    }

    // report errors in the pipeline - this has to come after all other middleware and routers
    app.use(
        expressWinston.errorLogger({
            transports: [new winston.transports.Console()],
            format: winston.format.json(),
        }),
    );
    return app;
}

export default makeApp;

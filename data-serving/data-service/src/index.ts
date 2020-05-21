import * as caseController from './controllers/case';
import * as homeController from './controllers/home';

import { OpenApiValidator } from 'express-openapi-validator';
import YAML from 'yamljs';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
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
apiRouter.get('/cases', caseController.list);
apiRouter.post('/cases', caseController.create);
apiRouter.put('/cases/:id([a-z0-9]{24})', caseController.update);
apiRouter.delete('/cases/:id([a-z0-9]{24})', caseController.del);
app.use('/api', apiRouter);

// API documentation.
const swaggerDocument = YAML.load('./api/openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API validation.
new OpenApiValidator({
    apiSpec: './api/openapi.yaml',
    validateResponses: true,
}).install(app);

(async (): Promise<void> => {
    try {
        console.log(
            'Connecting to MongoDB instance',
            // Print only after username and password to not log them.
            env.DB_CONNECTION_STRING.substring(
                env.DB_CONNECTION_STRING.indexOf('@'),
            ),
        );

        await mongoose.connect(env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        console.log('Connected to the database!');
    } catch (e) {
        console.error('Failed to connect to the database. :(', e);
        process.exit(1);
    }
})();

export default app;

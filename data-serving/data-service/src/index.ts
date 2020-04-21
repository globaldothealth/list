import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as caseController from './controllers/case';

const app = express();

dotenv.config();

// Express configuration.
app.set('port', process.env.PORT || 3000);
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
export default app;

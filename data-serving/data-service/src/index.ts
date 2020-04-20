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
app.get('/cases/:id', caseController.get);
app.get('/cases', caseController.list);
app.post('/cases', caseController.create);
app.put('/cases/:id', caseController.update);
app.delete('/cases/:id', caseController.del);

export default app;

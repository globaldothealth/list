import express from 'express';
import bodyParser from 'body-parser';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as caseController from './controllers/case';

const app = express();

// Express configuration.
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure app routes.
app.get('/', homeController.index);
app.get('/cases/:id', caseController.getCase);
app.get('/cases', caseController.listCases);
app.post('/cases', caseController.createCase);

export default app;

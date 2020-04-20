import express from 'express';

// Controllers (route handlers).
import * as homeController from './controllers/home';

const app = express();

// Express configuration.
app.set('port', process.env.PORT || 3000);

// Configure app routes.
app.get('/', homeController.index);

export default app;

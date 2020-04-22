import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Controllers (route handlers).
import * as homeController from './controllers/home';
import * as sourcesController from './controllers/sources';

const app = express();

dotenv.config();

// Express configuration.
app.set('port', process.env.PORT || 3001);

// Configure frontend app routes.
app.get('/', homeController.index);

// Configure API app routes.
const apiRouter = express.Router();
apiRouter.get('/sources/', sourcesController.list);
apiRouter.get('/sources/:id', sourcesController.get);
apiRouter.post('/sources/', sourcesController.create);
apiRouter.put('/sources/:id', sourcesController.update);
apiRouter.delete('/sources/:id', sourcesController.del);
app.use('/api', apiRouter);

(async (): Promise<void> => {
    try {
        console.log(
            'Connecting to instance ${process.env.DB_CONNECTION_STRING}',
        );
        await mongoose.connect(process.env.DB_CONNECTION_STRING || '', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database');
    } catch (e) {
        console.error('Failed to connect to DB', e);
    }
})();
export default app;

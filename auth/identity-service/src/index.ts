import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import validateEnv from './util/validate-env';

const app = express();

dotenv.config();
const env = validateEnv();

// Express configuration.
app.set('port', env.PORT);

// Configure dependencies.
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

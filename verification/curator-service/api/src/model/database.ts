import mongoose from 'mongoose';
import { logger } from '../util/logger';

export function connectToDatabase(mongoURL: string) {
    logger.info(
        'Connecting to MongoDB instance',
        // Print only after username and password to not log them.
        mongoURL.substring(mongoURL.indexOf('@'))
    );

    mongoose
        .connect(mongoURL, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        })
        .then(() => {
            logger.info('Connected to the database');
        })
        .catch((e) => {
            logger.error('Failed to connect to DB', e);
            process.exit(1);
        });
}

export const mongoClient = () => mongoose.connection.getClient();

export default () => mongoose.connection.getClient().db();

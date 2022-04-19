import { MongoClient } from 'mongodb';
import { logger } from '../util/logger';

let mongo: MongoClient;

export async function connectToDatabase(mongoURL: string) {
    logger.info(
        'Connecting to MongoDB instance',
        // Print only after username and password to not log them.
        mongoURL.substring(mongoURL.indexOf('@')),
    );

    try {
        mongo = await MongoClient.connect(mongoURL);
        logger.info('Connected to database');
    } catch (e) {
        logger.error('Cannot connect to database', e);
        process.exit(1);
    }
}

export const mongoClient = () => mongo;

export default () => mongoClient().db();

import { cleanEnv, str, port } from 'envalid';

export default function validateEnv(): void {
    cleanEnv(process.env, {
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost/',
        }),
        DB_NAME: str({
            desc: 'Name of the database to be connected to.',
            devDefault: 'dev',
        }),
        DB_COLLECTION: str({
            desc: 'Name of the MongoDB collection to operate on.',
            devDefault: 'covid19',
        }),
        PORT: port(),
    });
}

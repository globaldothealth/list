import { CleanEnv, cleanEnv, str, port } from 'envalid';

export default function validateEnv(): Readonly<{
    DB_CONNECTION_STRING: string;
    DB_NAME: string;
    PORT: number;
}> &
    CleanEnv & {
        readonly [varName: string]: string | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost:27017',
        }),
        DB_NAME: str({
            desc: 'Name of the database to be connected to.',
            devDefault: 'dev',
        }),
        PORT: port({ default: 3000 }),
    });
}

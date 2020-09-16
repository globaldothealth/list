import { CleanEnv, cleanEnv, port, str } from 'envalid';

export default function validateEnv(): Readonly<{
    DB_CONNECTION_STRING: string;
    PORT: number;
    SERVICE_ENV: string;
}> &
    CleanEnv & {
        readonly [varName: string]: string | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost:27017/covid19',
        }),
        PORT: port({ default: 3000 }),
        SERVICE_ENV: str({
            choices: ['local', 'dev', 'prod'],
            desc: 'Environment in which the service is running',
            devDefault: 'local',
        }),
    });
}

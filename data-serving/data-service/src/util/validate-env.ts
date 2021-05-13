import { CleanEnv, cleanEnv, port, str, bool, num } from 'envalid';

export default function validateEnv(): Readonly<{
    LOCATION_SERVICE_URL: string;
    DB_CONNECTION_STRING: string;
    PORT: number;
    SERVICE_ENV: string;
}> &
    CleanEnv & {
        readonly [varName: string]: string | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        LOCATION_SERVICE_URL: str({
            desc: 'Base location for the geocoding service',
            devDefault: 'http://location',
        }),
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

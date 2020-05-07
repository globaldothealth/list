import { CleanEnv, cleanEnv, port, str, url } from 'envalid';

export default function validateEnv(): Readonly<{
    DATASERVER_API_URL: string;
    DB_CONNECTION_STRING: string;
    PORT: number;
    GOOGLE_OAUTH_CLIENT_ID: string;
    GOOGLE_OAUTH_CLIENT_SECRET: string;
    SESSION_COOKIE_KEY: string;
}> &
    CleanEnv & {
        readonly [varName: string]: string | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        DATASERVER_API_URL: url({
            desc: 'URL at which to make requests to the data-service API',
            devDefault: 'http://localhost:3000/api',
        }),
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost:27017/covid19',
        }),
        PORT: port({ default: 3001 }),
        GOOGLE_OAUTH_CLIENT_ID: str({
            desc: 'OAuth client ID from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        GOOGLE_OAUTH_CLIENT_SECRET: str({
            desc: 'OAuth client secret from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        SESSION_COOKIE_KEY: str({
            desc: 'Secret key to sign cookies',
            devDefault: 'default-dev-key',
        }),
    });
}

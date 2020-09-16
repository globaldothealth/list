import { CleanEnv, bool, cleanEnv, port, str, url } from 'envalid';

export default function validateEnv(): Readonly<{
    AFTER_LOGIN_REDIRECT_URL: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SERVICE_REGION: string;
    DATASERVER_URL: string;
    DB_CONNECTION_STRING: string;
    EMAIL_USER_ADDRESS: string;
    EMAIL_USER_PASSWORD: string;
    ENABLE_FAKE_GEOCODER: boolean;
    ENABLE_LOCAL_AUTH: boolean;
    GLOBAL_RETRIEVAL_FUNCTION_ARN: string;
    GOOGLE_OAUTH_CLIENT_ID: string;
    GOOGLE_OAUTH_CLIENT_SECRET: string;
    MAPBOX_PERMANENT_GEOCODE: boolean;
    MAPBOX_TOKEN: string;
    PORT: number;
    SERVICE_ENV: string;
    SESSION_COOKIE_KEY: string;
    STATIC_DIR: string;
}> &
    CleanEnv & {
        readonly [varName: string]: string | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        AFTER_LOGIN_REDIRECT_URL: str({
            desc: 'URL to redirect to after the oauth consent screen',
            devDefault: 'http://localhost:3002/',
        }),
        AWS_ACCESS_KEY_ID: str({
            desc: 'ID for AWS access key credential',
            devDefault: 'fakeAccessKeyId',
            docs:
                'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html',
        }),
        AWS_SECRET_ACCESS_KEY: str({
            desc: 'Secret for AWS access key credential',
            devDefault: 'fakeSecretKey',
            docs:
                'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html',
        }),
        AWS_SERVICE_REGION: str({
            desc: 'AWS region in which to interact with services/resources',
            default: 'us-east-1',
        }),
        DATASERVER_URL: url({
            desc: 'URL at which to make requests to the data-service API',
            devDefault: 'http://localhost:3000',
        }),
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost:27017/covid19',
        }),
        EMAIL_USER_ADDRESS: str({
            desc: 'Address from which to send notification emails.',
            devDefault: '',
        }),
        EMAIL_USER_PASSWORD: str({
            desc:
                'Password of the email address account used to send notification emails.',
            devDefault: '',
        }),
        ENABLE_FAKE_GEOCODER: bool({
            desc: 'Whether to enable the fake seedable geocoder',
            devDefault: true,
            default: false,
        }),
        ENABLE_LOCAL_AUTH: bool({
            desc: 'Whether to enable local auth strategy for testing',
            devDefault: true,
            default: false,
        }),
        GLOBAL_RETRIEVAL_FUNCTION_ARN: str({
            desc: 'AWS ARN for the global source retrieval Lambda function',
            default:
                'arn:aws:lambda:us-east-1:612888738066:function:epid-ingestion-RetrievalFunction-1CEVOE6F2OOIV',
        }),
        GOOGLE_OAUTH_CLIENT_ID: str({
            desc: 'OAuth client ID from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        GOOGLE_OAUTH_CLIENT_SECRET: str({
            desc: 'OAuth client secret from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        MAPBOX_PERMANENT_GEOCODE: bool({
            desc: 'Whether to use the permanent geocode endpoint',
            devDefault: false,
            default: true,
        }),
        MAPBOX_TOKEN: str({
            desc: 'Mapbox token to use for geocoding',
            devDefault: '',
        }),
        PORT: port({ default: 3001 }),
        SERVICE_ENV: str({
            choices: ['local', 'dev', 'prod'],
            desc: 'Environment in which the service is running',
            devDefault: 'local',
        }),
        SESSION_COOKIE_KEY: str({
            desc: 'Secret key to sign cookies',
            devDefault: 'default-dev-key',
        }),
        STATIC_DIR: str({
            desc: 'Directory to serve static files from',
            devDefault: '',
        }),
    });
}

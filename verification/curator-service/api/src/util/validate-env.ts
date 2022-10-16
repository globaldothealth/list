import { bool, cleanEnv, port, str, url } from 'envalid';

export default function validateEnv(): Readonly<{
    AFTER_LOGIN_REDIRECT_URL: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_SERVICE_REGION: string;
    COMPLETE_DATA_BUCKET: string;
    COUNTRY_DATA_BUCKET: string;
    CURATOR_VERSION: string;
    DATASERVER_URL: string;
    DB_CONNECTION_STRING: string;
    EMAIL_USER_ADDRESS: string;
    ENABLE_LOCAL_AUTH: boolean;
    EVENT_ROLE_ARN: string;
    GOOGLE_OAUTH_CLIENT_ID: string;
    GOOGLE_OAUTH_CLIENT_SECRET: string;
    LOCALSTACK_URL: string;
    LOCATION_SERVICE_URL: string;
    JOB_QUEUE_ARN: string;
    PORT: number;
    SERVICE_ENV: string;
    SESSION_COOKIE_KEY: string;
    STATIC_DIR: string;
    DISEASE_NAME: string;
    REACT_APP_RECAPTCHA_SITE_KEY: string;
    RECAPTCHA_SECRET_KEY: string;
}> & {
    readonly [varName: string]: string | boolean | number | undefined;
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
            docs: 'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html',
        }),
        AWS_SECRET_ACCESS_KEY: str({
            desc: 'Secret for AWS access key credential',
            devDefault: 'fakeSecretKey',
            docs: 'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html',
        }),
        AWS_SERVICE_REGION: str({
            desc: 'AWS region in which to interact with services/resources',
            default: 'eu-central-1',
        }),
        COMPLETE_DATA_BUCKET: str({
            desc: 'S3 bucket containing case data by country',
            devDefault: 'covid-19-data-export-dev-eu',
        }),
        COUNTRY_DATA_BUCKET: str({
            desc: 'S3 bucket containing case data by country',
            devDefault: 'covid-19-country-export-dev-eu',
        }),
        CURATOR_VERSION: str({
            desc: 'version string to display in UI for bug reports etc.',
            devDefault: '(local testing)',
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
            devDefault: 'fake@email.com',
        }),
        ENABLE_LOCAL_AUTH: bool({
            desc: 'Whether to enable local auth strategy for testing',
            devDefault: true,
            default: false,
        }),
        EVENT_ROLE_ARN: str({
            desc: 'AWS ARN for EventBridge rules',
            devDefault: 'default-dev-arn',
        }),
        GOOGLE_OAUTH_CLIENT_ID: str({
            desc: 'OAuth client ID from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        GOOGLE_OAUTH_CLIENT_SECRET: str({
            desc: 'OAuth client secret from the Google developer console',
            devDefault: 'replace to enable auth',
        }),
        LOCALSTACK_URL: str({
            desc: 'Mock AWS address',
            devDefault: 'http://localstack:4566',
            default: '',
        }),
        LOCATION_SERVICE_URL: str({
            desc: 'Base location for the geocoding service',
            devDefault: 'http://location',
        }),
        JOB_QUEUE_ARN: str({
            desc: 'AWS ARN for Batch job queue',
            devDefault: 'default-dev-arn',
        }),
        PORT: port({ default: 3001 }),
        SERVICE_ENV: str({
            choices: ['local', 'locale2e', 'dev', 'qa', 'prod'],
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
        DISEASE_NAME: str({
            desc: 'Name of the disease that should be displayed in Curator UI',
            devDefault: 'COVID-19',
        }),
        REACT_APP_RECAPTCHA_SITE_KEY: str({
            desc: 'Key for recaptcha component',
            devDefault: '',
        }),
        RECAPTCHA_SECRET_KEY: str({
            desc: 'Key to validate recaptcha request',
            devDefault: '',
        }),
    });
}

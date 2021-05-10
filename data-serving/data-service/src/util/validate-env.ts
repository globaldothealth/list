import { CleanEnv, cleanEnv, port, str, bool, num } from 'envalid';

export default function validateEnv(): Readonly<{
    DB_CONNECTION_STRING: string;
    PORT: number;
    SERVICE_ENV: string;
    MAPBOX_PERMANENT_GEOCODE: boolean;
    MAPBOX_TOKEN: string;
    ENABLE_FAKE_GEOCODER: boolean;
    MAPBOX_GEOCODE_RATE_LIMIT_PER_MIN: number;
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
        MAPBOX_PERMANENT_GEOCODE: bool({
            desc: 'Whether to use the permanent geocode endpoint',
            devDefault: false,
            default: true,
        }),
        MAPBOX_TOKEN: str({
            desc: 'Mapbox token to use for geocoding',
            devDefault: '',
        }),
        ENABLE_FAKE_GEOCODER: bool({
            desc: 'Whether to enable the fake seedable geocoder',
            devDefault: true,
            default: false,
        }),
        MAPBOX_GEOCODE_RATE_LIMIT_PER_MIN: num({
            desc:
                'number of requests per minute allowed to mapbox geocode endpoint',
            devDefault: 50,
            default: 600,
        }),
    });
}

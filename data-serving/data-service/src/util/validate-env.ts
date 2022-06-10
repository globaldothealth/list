import { cleanEnv, makeValidator, port, str } from 'envalid';

const date = makeValidator(x => {
try {
        return new Date(x);
    } catch(e) {
        throw new Error('Expect the date to be a day in ISO8601 format');
    }
})

export default function validateEnv(): Readonly<{
    LOCATION_SERVICE_URL: string;
    DB_CONNECTION_STRING: string;
    PORT: number;
    SERVICE_ENV: string;
    OUTBREAK_DATE: Date;
}> & {
        readonly [varName: string]: string | boolean | number | Date | undefined;
        // eslint-disable-next-line indent
    } {
    return cleanEnv(process.env, {
        LOCATION_SERVICE_URL: str({
            desc: 'Base location for the geocoding service',
            devDefault: 'http://localhost:3003',
        }),
        DB_CONNECTION_STRING: str({
            desc: 'MongoDB URI provided to MongoClient.',
            devDefault: 'mongodb://localhost:27017/covid19',
        }),
        PORT: port({ default: 3000 }),
        SERVICE_ENV: str({
            choices: ['local', 'dev', 'qa', 'prod'],
            desc: 'Environment in which the service is running',
            devDefault: 'local',
        }),
        OUTBREAK_DATE: date({
            desc: 'The earliest date for which cases should be recorded',
            devDefault: new Date('2019-11-01'),
        }),
    });
}

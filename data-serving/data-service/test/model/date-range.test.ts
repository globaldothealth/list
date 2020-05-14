import { DateRangeDocument, dateRangeSchema } from '../../src/model/date-range';

import fullModel from './data/date-range.full.json';
import mongoose from 'mongoose';

const DateRange = mongoose.model<DateRangeDocument>(
    'DateRange',
    dateRangeSchema,
);

describe('validate', () => {
    it('an empty date range document is valid', async () => {
        return new DateRange({}).validate();
    });

    it('an open-ended date range document is valid', async () => {
        const openEndedModel = Object.assign({}, fullModel);
        delete fullModel.end;

        return new DateRange(openEndedModel).validate();
    });

    it('an open-start date range document is valid', async () => {
        const openStartModel = Object.assign({}, fullModel);
        delete fullModel.start;

        return new DateRange(openStartModel).validate();
    });

    it('a fully specified date range document is valid', async () => {
        return new DateRange(fullModel).validate();
    });
});

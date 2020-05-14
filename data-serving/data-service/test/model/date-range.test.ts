import { DateRangeDocument, dateRangeSchema } from '../../src/model/date-range';

import fullDateRange from './data/date-range.full.json';
import mongoose from 'mongoose';

const DateRange = mongoose.model<DateRangeDocument>(
    'DateRange',
    dateRangeSchema,
);

describe('validate', () => {
    it('an empty date range document is valid', async () => {
        return new DateRange({}).validate();
    });

    it('a fully specified date range document is valid', async () => {
        return new DateRange(fullDateRange).validate();
    });
});

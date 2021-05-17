import { DateRangeDocument, dateRangeSchema } from '../../src/model/date-range';

import fullModel from './data/date-range.full.json';
import minimalModel from './data/date-range.minimal.json';
import mongoose from 'mongoose';

const DateRange = mongoose.model<DateRangeDocument>(
    'DateRange',
    dateRangeSchema,
);

describe('validate', () => {
    it('an open-ended date range document is valid', async () => {
        const openEndedModel: any = { ...fullModel };
        delete openEndedModel.end;

        return new DateRange(openEndedModel).validate();
    });

    it('an open-start date range document is valid', async () => {
        const openStartModel: any = { ...fullModel };
        delete openStartModel.start;

        return new DateRange(openStartModel).validate();
    });

    it('a minimal date range document is valid', async () => {
        return new DateRange(minimalModel).validate();
    });

    it('a fully specified date range document is valid', async () => {
        return new DateRange(fullModel).validate();
    });
});

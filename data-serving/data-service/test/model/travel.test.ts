import { TravelDocument, travelSchema } from '../../src/model/travel';

import { Error } from 'mongoose';
import fullDateRange from './data/date-range.full.json';
import fullLocation from './data/location.full.json';
import mongoose from 'mongoose';

const Travel = mongoose.model<TravelDocument>('Travel', travelSchema);

describe('validate', () => {
    it('an unknown travel purpose is invalid', async () => {
        return new Travel({
            purpose: 'Needed to just get away, you know?',
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an empty travel document is valid', async () => {
        return new Travel({}).validate();
    });

    it('a fully specified travel document is valid', async () => {
        return new Travel({
            location: fullLocation,
            dateRange: fullDateRange,
            purpose: 'Family',
            additionalInformation: 'Skeletal lamping',
        }).validate();
    });
});

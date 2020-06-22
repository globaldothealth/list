import {
    TravelHistoryDocument,
    travelHistorySchema,
} from '../../src/model/travel-history';

import { Error } from 'mongoose';
import fullModel from './data/travel-history.full.json';
import minimalModel from './data/travel-history.minimal.json';
import mongoose from 'mongoose';

const TravelHistory = mongoose.model<TravelHistoryDocument>(
    'TravelHistory',
    travelHistorySchema,
);

describe('validate', () => {
    it('a non-integer numLocations is invalid', async () => {
        return new TravelHistory({
            ...minimalModel,
            numLocations: 1.1,
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal travelHistory is valid', async () => {
        return new TravelHistory(minimalModel).validate();
    });

    it('a fully specified travelHistory is valid', async () => {
        return new TravelHistory(fullModel).validate();
    });
});

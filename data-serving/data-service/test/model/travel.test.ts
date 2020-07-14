import { TravelDocument, travelSchema } from '../../src/model/travel';

import fullModel from './data/travel.full.json';
import minimalModel from './data/travel.minimal.json';
import mongoose from 'mongoose';

const Travel = mongoose.model<TravelDocument>('Travel', travelSchema);

describe('validate', () => {
    it('a minimal travel document is valid', async () => {
        return new Travel(minimalModel).validate();
    });

    it('a fully specified travel document is valid', async () => {
        return new Travel(fullModel).validate();
    });
});

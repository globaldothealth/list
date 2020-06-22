import { TravelDocument, travelSchema } from '../../src/model/travel';

import { Error } from 'mongoose';
import fullModel from './data/travel.full.json';
import minimalModel from './data/travel.minimal.json';
import mongoose from 'mongoose';

const Travel = mongoose.model<TravelDocument>('Travel', travelSchema);

describe('validate', () => {
    it('an unknown travel purpose is invalid', async () => {
        return new Travel({
            ...fullModel,
            ...{ purpose: 'Needed to just get away, you know?' },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('an unknown travel method is invalid', async () => {
        return new Travel({
            ...fullModel,
            ...{ method: 'Unicycle' },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal travel document is valid', async () => {
        return new Travel(minimalModel).validate();
    });

    it('a fully specified travel document is valid', async () => {
        return new Travel(fullModel).validate();
    });
});

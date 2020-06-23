import {
    TransmissionDocument,
    transmissionSchema,
} from '../../src/model/transmission';

import { Error } from 'mongoose';
import fullModel from './data/transmission.full.json';
import minimalModel from './data/transmission.minimal.json';
import mongoose from 'mongoose';

const Transmission = mongoose.model<TransmissionDocument>(
    'Transmission',
    transmissionSchema,
);

describe('validate', () => {
    it('an unknown route is invalid', async () => {
        return new Transmission({
            ...minimalModel,
            ...{ routes: ['Zombie bite'] },
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal transmission document is valid', async () => {
        return new Transmission(minimalModel).validate();
    });

    it('a fully specified transmission document is valid', async () => {
        return new Transmission(fullModel).validate();
    });
});

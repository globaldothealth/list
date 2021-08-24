import { VaccineDocument, vaccineSchema } from '../../src/model/vaccine';

import { Error } from 'mongoose';
import mongoose from 'mongoose';

const Vaccine = mongoose.model<VaccineDocument>('Vaccine', vaccineSchema);

describe('validate', () => {
    it('vaccine model with various fields filled is valid', async () => {
        const aVaccine = new Vaccine({
            name: 'Moderna',
            date: new Date(),
            batch: '1234-ABCD',
            symptoms: ['anosmia'],
        });
        return aVaccine.validate();
    });
});

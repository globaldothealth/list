import { VariantDocument, variantSchema } from '../../src/model/variant';

import { Error } from 'mongoose';
import mongoose from 'mongoose';

const Variant = mongoose.model<VariantDocument>('Variant', variantSchema);

describe('validate', () => {
    it('variant model with a name is valid', async () => {
        return new Variant({ name: 'B 1.1.7' }).validate();
    });
});

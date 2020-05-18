import { OriginDocument, originSchema } from '../../src/model/origin';

import { Error } from 'mongoose';
import fullModel from './data/origin.full.json';
import minimalModel from './data/origin.minimal.json';
import mongoose from 'mongoose';

const Origin = mongoose.model<OriginDocument>('Origin', originSchema);

describe('validate', () => {
    it('an origin without a URL is invalid', async () => {
        const missingName = { ...minimalModel };
        delete missingName.url;

        return new Origin(missingName).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal origin is valid', async () => {
        return new Origin(minimalModel).validate();
    });

    it('a fully specified origin is valid', async () => {
        return new Origin(fullModel).validate();
    });
});

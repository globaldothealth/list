import { Error } from 'mongoose';
import mongoose from 'mongoose';
import { uniqueStringsArrayFieldInfo } from '../../src/model/unique-strings-array';

/** A fake model with a field using the positive int schema. */
const FakeModel = mongoose.model(
    'FakeDocument',
    new mongoose.Schema({
        uniqueStringsArray: uniqueStringsArrayFieldInfo,
    }),
);

describe('validate', () => {
    it('a values field with duplicate values is invalid', async () => {
        return new FakeModel({ uniqueStringsArray: ['a', 'a'] }).validate(
            (e) => {
                expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });
});

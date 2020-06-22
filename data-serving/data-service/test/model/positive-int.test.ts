import { Error } from 'mongoose';
import mongoose from 'mongoose';
import { positiveIntFieldInfo } from '../../src/model/positive-int';

/** A fake model with a field using the positive int schema. */
const FakeModel = mongoose.model(
    'FakeDocument',
    new mongoose.Schema({
        positiveInt: positiveIntFieldInfo,
    }),
);

describe('validate', () => {
    it('a type other than number is invalid', async () => {
        return new FakeModel({ positiveInt: 'not-a-number' }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a floating point number is invalid', async () => {
        return new FakeModel({ positiveInt: 1.1 }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a negative int is invalid', async () => {
        return new FakeModel({ positiveInt: -1 }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
});

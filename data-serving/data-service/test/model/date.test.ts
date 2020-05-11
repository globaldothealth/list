import { Error } from 'mongoose';
import { dateSchema } from '../../src/model/date';
import mongoose from 'mongoose';

/** A fake model with a field using the date schema. */
const FakeModel = mongoose.model(
    'FakeDocument',
    new mongoose.Schema({
        date: dateSchema,
    }),
);

describe('validate', () => {
    it('a type other than Date is invalid', async () => {
        return new FakeModel({ date: 'not-a-date' }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a date before 2019-11-01 is invalid', async () => {
        return new FakeModel({ date: Date.parse('2019-10-31') }).validate(
            (e) => {
                expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a date in the future is invalid', async () => {
        return new FakeModel({
            date: new Date(Date.now() + 1000 /* seconds */),
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a date between 2019-11-01 and now is valid', async () => {
        return new FakeModel({ date: '2019-11-01' }).validate();
    });
});

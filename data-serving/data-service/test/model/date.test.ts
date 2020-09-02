import { Error } from 'mongoose';
import { dateFieldInfo } from '../../src/model/date';
import mongoose from 'mongoose';

/** A fake model with a field using the date schema. */
const FakeModel = mongoose.model(
    'FakeDocument',
    new mongoose.Schema({
        date: dateFieldInfo,
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

    it('a date too far in the future is invalid', async () => {
        return new FakeModel({
            date: new Date(Date.now() + 10000 /* seconds */),
        }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a date ISO date form is valid', async () => {
        return new FakeModel({ date: '2019-11-01' }).validate();
    });

    it('a date in ISO date-time form is valid', async () => {
        return new FakeModel({ date: '2020-05-10T14:48:00' }).validate();
    });

    it('a date in ISO date-time + ms + tz form is valid', async () => {
        return new FakeModel({
            date: '2020-05-10T14:48:00.000+09:00',
        }).validate();
    });
});

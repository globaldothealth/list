import { Source, sourceSchema } from '../../src/model/source';

import { Error } from 'mongoose';
import mongoose from 'mongoose';

describe('validate', () => {
    it('empty source is invalid', async () => {
        return new Source({}).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a source with only an id is valid', async () => {
        return new Source({ id: 'abc' }).validate();
    });

    it('a source with only url is valid', async () => {
        return new Source({ url: 'http://abc.def' }).validate();
    });

    it('a source with only "other" is valid', async () => {
        return new Source({ other: 'ghi' }).validate();
    });

    it('a fully specified source is valid', async () => {
        return new Source({
            id: 'abc',
            url: 'http://abc.def',
            other: 'ghi',
        }).validate();
    });

    it('validators work for embedded sources', async () => {
        const FakeModel = mongoose.model(
            'FakeDocument',
            new mongoose.Schema({
                source: sourceSchema,
            }),
        );
        return new FakeModel({ source: {} }).validate((e) => {
            console.log(e);
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
});

import { SourceDocument, sourceSchema } from '../../src/model/source';

import { Error } from 'mongoose';
import fullModel from './data/source.full.json';
import mongoose from 'mongoose';

const Source = mongoose.model<SourceDocument>('Source', sourceSchema);

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
        return new Source(fullModel).validate();
    });

    it('validators work for embedded sources', async () => {
        const FakeModel = mongoose.model(
            'FakeDocument',
            new mongoose.Schema({
                source: sourceSchema,
            }),
        );
        return new FakeModel({ source: {} }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });
});

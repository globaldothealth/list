import { Error } from 'mongoose';
import { RevisionMetadata } from '../../src/model/revision-metadata';

/** A sample document with the minimim required fields. */
const minimalModel = {
    id: 0,
    moderator: 'm',
    date: new Date(),
};

describe('validate', () => {
    it('revision metadata without id is invalid', async () => {
        const noId = Object.assign({}, minimalModel);
        delete noId.id;

        return new RevisionMetadata(noId).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('revision metadata without moderator is invalid', async () => {
        const noModerator = Object.assign({}, minimalModel);
        delete noModerator.moderator;

        return new RevisionMetadata(noModerator).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('revision metadata without date is invalid', async () => {
        const noDate = Object.assign({}, minimalModel);
        delete noDate.date;

        return new RevisionMetadata(noDate).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('revision metadata with non-integer id invalid', async () => {
        const badId = Object.assign({}, minimalModel);
        badId.id = 2.2;

        return new RevisionMetadata(badId).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('minimal revision metadata model is valid', async () => {
        return new RevisionMetadata(minimalModel).validate();
    });

    it('fully specified revision metadata model is valid', async () => {
        return new RevisionMetadata({
            ...minimalModel,
            notes: 'n',
        }).validate();
    });
});

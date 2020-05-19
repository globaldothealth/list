import { Case } from '../../src/model/case';
import { Error } from 'mongoose';
import fullModel from './data/case.full.json';
import minimalModel from './data/case.minimal.json';

describe('validate', () => {
    it('model without sources is invalid', async () => {
        return new Case({ ...minimalModel, sources: [] }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('model without confirmed event is invalid', async () => {
        return new Case({ ...minimalModel, events: [] }).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('model without revision metadata is invalid', async () => {
        const noRevisionmetadata = { ...minimalModel };
        delete noRevisionmetadata.revisionMetadata;

        return new Case(noRevisionmetadata).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('minimal model is valid', async () => {
        return new Case(minimalModel).validate();
    });

    it('fully-specified model is valid', async () => {
        return new Case(fullModel).validate();
    });
});

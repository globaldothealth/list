import {
    CaseReferenceDocument,
    caseReferenceSchema,
} from '../../src/model/case-reference';

import { Error } from 'mongoose';
import fullModel from './data/case-reference.full.json';
import minimalModel from './data/case-reference.minimal.json';
import mongoose from 'mongoose';

const CaseReference = mongoose.model<CaseReferenceDocument>(
    'CaseReference',
    caseReferenceSchema,
);

describe('validate', () => {
    it('a caseReference document without sourceId is invalid', async () => {
        const missingSourceId = { ...minimalModel };
        delete missingSourceId.sourceId;

        return new CaseReference(missingSourceId).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a caseReference document without sourceUrl is invalid', async () => {
        const missingSourceUrl = { ...minimalModel };
        delete missingSourceUrl.sourceUrl;

        return new CaseReference(missingSourceUrl).validate((e) => {
            expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('a minimal caseReference document is valid', async () => {
        return new CaseReference(minimalModel).validate();
    });

    it('a fully specified caseReference document is valid', async () => {
        return new CaseReference(fullModel).validate();
    });
});

describe('default', () => {
    it('verificationStatus is UNVERIFIED', () => {
        expect(new CaseReference(minimalModel).verificationStatus).toBe(
            'UNVERIFIED',
        );
    });
});

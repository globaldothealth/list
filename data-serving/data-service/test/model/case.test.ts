import { Case } from '../../src/model/case';
import { Error } from 'mongoose';
import fullModel from './data/case.full.json';
import minimalEvent from './data/event.minimal.json';
import minimalModel from './data/case.minimal.json';

describe('validate', () => {
    it('model without caseReference is invalid', async () => {
        const noCaseReference: any = { ...minimalModel };
        delete noCaseReference.caseReference;

        return new Case({ ...noCaseReference }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('model without events is invalid', async () => {
        return new Case({ ...minimalModel, events: [] }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('model without confirmed event is invalid', async () => {
        const notConfirmedEvent = { ...minimalEvent, name: 'not-confirmed' };
        return new Case({
            ...minimalModel,
            events: [notConfirmedEvent],
        }).validate((e) => {
            expect(e).not.toBeNull();
            if (e) expect(e.name).toBe(Error.ValidationError.name);
        });
    });

    it('minimal model is valid', async () => {
        return new Case(minimalModel).validate();
    });

    it('fully-specified model is valid', async () => {
        return new Case(fullModel).validate();
    });
});

describe('custom instance methods', () => {
    it('equalsJSON returns true for identical case', () => {
        const c = new Case(fullModel);
        expect(c.equalsJSON(fullModel)).toBe(true);
    });
    it('equalsJSON returns true for case differing in caseReference', () => {
        const c = new Case(fullModel);
        const comparison: any = fullModel;
        delete comparison.caseReference;
        expect(c.equalsJSON(comparison)).toBe(true);
    });
    it('equalsJSON returns true for case differing in revisionMetadata', () => {
        const c = new Case(fullModel);
        const comparison: any = fullModel;
        delete comparison.revisionMetadata;
        expect(c.equalsJSON(comparison)).toBe(true);
    });
    it('equalsJSON returns true for case differing in importedCase', () => {
        const c = new Case(fullModel);
        const comparison: any = fullModel;
        delete comparison.importedCase;
        expect(c.equalsJSON(comparison)).toBe(true);
    });
    it('equalsJSON returns false for semantically differing case', () => {
        const c = new Case(fullModel);
        const comparison: any = fullModel;
        delete comparison.demographics.gender;
        expect(c.equalsJSON(comparison)).toBe(false);
    });
});

import { Case } from '../../src/model/case';
import { doesNotMatch } from 'assert';
import fullCase from './data/case.full.json';
import minimalCase from './data/case.minimal.json';

describe('validate', () => {
    it('minimal model should be valid', async () => {
        const c = new Case(minimalCase);

        return c.validate();
    });
    it('fully-specified model should be valid', async () => {
        const c = new Case(fullCase);

        return c.validate();
    });

    it('incomplete model should be invalid', async () => {
        const c = new Case({});

        return c.validate((e) => {
            expect(e.errors).not.toBe({});
        });
    });
    // TODO: Add more validation tests once the schema is more stable.
});

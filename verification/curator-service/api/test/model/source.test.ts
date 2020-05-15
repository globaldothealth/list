import { Source } from '../../src/model/source';
import fullSource from './data/source.full.json';
import minimalSource from './data/source.minimal.json';

describe('validate', () => {
    it('minimal model should be valid', () => {
        const s = new Source(minimalSource);

        return s.validate();
    });
    it('full model should be valid', () => {
        const s = new Source(fullSource);

        return s.validate();
    });
    it('incomplete model should be invalid', () => {
        const errors = new Source({}).validateSync();

        expect(errors).toBeDefined();
        expect(errors?.toString()).toMatch('Enter a name');
        expect(errors?.toString()).toMatch('Enter an origin');
    });
});

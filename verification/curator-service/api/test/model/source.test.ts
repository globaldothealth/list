import { awsRuleDescriptionForSource, awsRuleNameForSource, awsRuleTargetIdForSource, awsStatementIdForSource, Source } from '../../src/model/source';
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

describe('helper functions', () => {
    it('awsStatementIdForSource returns formatted source ID', () => {
        const s = new Source(minimalSource);
        expect(awsStatementIdForSource(s)).toContain(s._id.toString());
    });
    it('awsRuleDescriptionForSource returns formatted source name', () => {
        const s = new Source(minimalSource);
        expect(awsRuleDescriptionForSource(s)).toContain(s.name);
    });
    it('awsRuleNameForSource returns formatted source ID', () => {
        const s = new Source(minimalSource);
        expect(awsRuleNameForSource(s)).toContain(s._id.toString());
    });
    it('awsRuleTargetIdForSource returns formatted source ID', () => {
        const s = new Source(minimalSource);
        expect(awsRuleTargetIdForSource(s)).toContain(s._id.toString());
    });
});

import CaseValidationError from './CaseValidationError';

const exampleApiResponse =
    'Case validation failed: demographics.gender: `female` is not a valid enum ' +
    'value for path `gender`., demographics.ageRange.end: Path `ageRange.end` ' +
    '(419) is more than maximum allowed value (120)., demographics: ' +
    'Validation failed: gender: `female` is not a valid enum value for path ' +
    '`gender`., ageRange.end: Path `ageRange.end` (419) is more than maximum ' +
    'allowed value (120).';

describe('constructed object', () => {
    it('exposes provided row number', () => {
        const o = new CaseValidationError(42, '');
        expect(o.rowNumber).toEqual(42);
    });
    it('breaks provided API response down to alphabetized, unique fields', () => {
        const o = new CaseValidationError(42, exampleApiResponse);
        // Only `demographics.ageRange.end` and `demographics.gender`are unique.
        expect(o.formattedIssues).toHaveLength(2);
        expect(o.formattedIssues).toContain(
            'demographics.ageRange.end: Path `ageRange.end` (419) is more ' +
                'than maximum allowed value (120)',
        );
        expect(o.formattedIssues).toContain(
            'demographics.gender: `female` is not a valid enum value for path ' +
                '`gender`',
        );
    });
});

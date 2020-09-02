import { render, wait } from '@testing-library/react';

import CaseValidationError from './CaseValidationError';
import React from 'react';
import ValidationErrorList from './ValidationErrorList';

const exampleApiResponse =
    'Case validation failed: demographics.gender: `female` is not a valid enum ' +
    'value for path `gender`., demographics.ageRange.end: Path `ageRange.end` ' +
    '(419) is more than maximum allowed value (120)., demographics: ' +
    'Validation failed: gender: `female` is not a valid enum value for path ' +
    '`gender`., ageRange.end: Path `ageRange.end` (419) is more than maximum ' +
    'allowed value (120).';

function caseValidationError(rowNumber: number): CaseValidationError {
    return new CaseValidationError(rowNumber, exampleApiResponse);
}

it('displays summary and issues', async () => {
    const { getAllByText, getByTestId, getByText } = render(
        <ValidationErrorList
            errors={[caseValidationError(1), caseValidationError(2)]}
            maxDisplayErrors={2}
        />,
    );

    const summary = getByTestId('summary');
    const icon = getByTestId('icon');

    expect(summary).toBeInTheDocument();
    expect(summary).toContainElement(icon);
    expect(summary).toHaveTextContent(
        'The selected file could not be uploaded. Found 2 row(s) with errors.',
    );

    expect(getByText('Row 1')).toBeInTheDocument();
    expect(getByText('Row 2')).toBeInTheDocument();
    expect(getAllByText(/demographics.gender/)).toHaveLength(2);
    expect(getAllByText(/demographics.ageRange.end/)).toHaveLength(2);
});

it('truncates total rows to max errors', async () => {
    const { getByTestId, getByText, queryByText } = render(
        <ValidationErrorList
            errors={[caseValidationError(1), caseValidationError(2)]}
            maxDisplayErrors={1}
        />,
    );

    expect(getByTestId('summary')).toHaveTextContent(
        'The selected file could not be uploaded. Found 2 row(s) with ' +
            'errors. Displaying first 1 below.',
    );
    expect(getByText('Row 1')).toBeInTheDocument();
    expect(queryByText('Row 2')).not.toBeInTheDocument();
});

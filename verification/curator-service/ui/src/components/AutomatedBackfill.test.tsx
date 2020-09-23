import AutomatedBackfill from './AutomatedBackfill';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { render } from '@testing-library/react';

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

it('renders form', async () => {
    const { getByTestId, getByText, getByRole } = render(
        <MemoryRouter>
            <AutomatedBackfill
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );

    // Header text
    expect(getByTestId('header-title')).toBeInTheDocument();
    expect(getByTestId('header-blurb')).toBeInTheDocument();

    // Source selection
    const sourceComponent = getByTestId('caseReference');
    expect(getByRole('combobox')).toContainElement(sourceComponent);

    // Date fields
    expect(getByText('First date to backfill (inclusive)')).toBeInTheDocument();
    expect(getByText('Last date to backfill (inclusive)')).toBeInTheDocument();

    // Buttons
    expect(getByText(/backfill source/i)).toBeEnabled();
    expect(getByText(/cancel/i)).toBeEnabled();
});

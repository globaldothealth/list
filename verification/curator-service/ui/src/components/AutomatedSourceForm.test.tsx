import AutomatedSourceForm from './AutomatedSourceForm';
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
    const { getByTestId, getByText } = render(
        <MemoryRouter>
            <AutomatedSourceForm
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

    // Source fields
    expect(getByTestId('name')).toBeInTheDocument();
    expect(getByTestId('url')).toBeInTheDocument();
    expect(getByTestId('format')).toBeInTheDocument();
    expect(getByTestId('recipients')).toBeInTheDocument();
    expect(getByTestId('excludeFromLineList')).toBeInTheDocument();
    expect(getByTestId('hasStableIdentifiers')).toBeInTheDocument();

    // Buttons
    expect(getByText(/create source/i)).toBeEnabled();
    expect(getByText(/cancel/i)).toBeEnabled();
});

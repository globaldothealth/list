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
    const { getByText } = render(
        <MemoryRouter>
            <AutomatedSourceForm
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );

    expect(getByText('New automated data source')).toBeInTheDocument();
    expect(
        getByText('Provide details about the automated data source'),
    ).toBeInTheDocument();
});

import { fireEvent, render, wait } from '@testing-library/react';

import CaseForm from './CaseForm';
import React from 'react';

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

it('renders form', () => {
    const { getByText, getAllByText } = render(<CaseForm user={user} />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();
    expect(getAllByText(/Demographics/i)).toHaveLength(2);
    expect(getAllByText(/Location/i)).toHaveLength(4);
    expect(getAllByText(/Events/i)).toHaveLength(2);
    expect(getByText(/Source URL/i)).toBeInTheDocument();
    expect(getByText(/Nationality/i)).toBeInTheDocument();
});

it('can add and remove genome sequencing sections', async () => {
    const { queryByTestId, getByText } = render(<CaseForm user={user} />);

    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
    await wait(() => {
        fireEvent.click(getByText(/Add genome sequence/));
    });
    expect(queryByTestId('genome-sequence-section')).toBeInTheDocument();
    await wait(() => {
        fireEvent.click(queryByTestId('remove-genome-sequence-button'));
    });
    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
});

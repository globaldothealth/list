import { fireEvent, render, wait } from '@testing-library/react';

import NewCaseForm from './NewCaseForm';
import React from 'react';

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

it('renders form', () => {
    const { getByText, getAllByText } = render(<NewCaseForm user={user} />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();
    expect(getAllByText(/Demographics/i)).toHaveLength(2);
    expect(getAllByText(/Location/i)).toHaveLength(4);
    expect(getAllByText(/Events/i)).toHaveLength(2);
    expect(getByText(/Source URL/i)).toBeInTheDocument();
    expect(getByText(/Nationality/i)).toBeInTheDocument();
});

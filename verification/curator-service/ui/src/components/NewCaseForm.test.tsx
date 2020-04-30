import NewCaseForm from './NewCaseForm';
import React from 'react';
import { render } from '@testing-library/react';

test('renders form', () => {
    const { getByText } = render(<NewCaseForm />);
    expect(getByText(/Submit/i)).toBeInTheDocument();
    expect(getByText(/Country/i)).toBeInTheDocument();
});  
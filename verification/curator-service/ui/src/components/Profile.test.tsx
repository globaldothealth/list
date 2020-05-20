import { render, screen } from '@testing-library/react';
import Profile from './Profile';
import React from 'react';

test('shows profile when passed user information', async () => {
    render(<Profile user={{ name: 'Alice Smith', email: 'foo@bar.com' }} />);
    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
});

test('shows login message when not passed user information', async () => {
    render(<Profile user={{ name: '', email: '' }} />);
    expect(screen.getByText(/Login required to view this page/i))
        .toBeInTheDocument();
});
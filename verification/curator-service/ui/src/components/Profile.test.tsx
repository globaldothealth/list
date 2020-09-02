import { render, screen } from '@testing-library/react';

import Profile from './Profile';
import React from 'react';

test('shows profile when passed user information', async () => {
    render(
        <Profile
            user={{
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin', 'reader'],
            }}
        />,
    );
    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByText(/reader/i)).toBeInTheDocument();
});

test('shows login message when not passed user information', async () => {
    render(<Profile user={{ _id: '', name: '', email: '', roles: [] }} />);
    expect(
        screen.getByText(/Login required to view this page/i),
    ).toBeInTheDocument();
});

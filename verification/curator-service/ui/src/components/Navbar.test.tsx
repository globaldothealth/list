import { act, fireEvent, render, screen } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';
import React from 'react';
import { createMemoryHistory } from 'history';

test('renders brand', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <Navbar user={{ name: 'Alice Smith', email: 'foo@bar.com' }} />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/Global Health/i)).toBeInTheDocument();
});

test('renders login button when not passed user information', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <Navbar user={{ name: '', email: '' }} />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test('renders logout button when passed user information', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <Navbar user={{ name: 'Alice Smith', email: 'foo@bar.com' }} />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
});

test('redirects to home on click', async () => {
    const history = createMemoryHistory();
    await act(async () => {
        render(
            <MemoryRouter>
                <Navbar user={{ name: 'Alice Smith', email: 'foo@bar.com' }} />
            </MemoryRouter>,
        );
    });
    fireEvent.click(screen.getByTestId('home-btn'));
    expect(history.location.pathname).toBe('/');
});

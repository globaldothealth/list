import { act, fireEvent, render, screen } from '@testing-library/react';

import EpidNavbar from './EpidNavbar';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { createMemoryHistory } from 'history';

test('renders epid brand', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar
                    user={{ name: 'Alice Smith', email: 'foo@bar.com' }}
                />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/epid/i)).toBeInTheDocument();
});

test('renders login button when not passed user information', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar user={{ name: '', email: '' }} />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test('renders logout button when passed user information', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar
                    user={{ name: 'Alice Smith', email: 'foo@bar.com' }}
                />
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
                <EpidNavbar
                    user={{ name: 'Alice Smith', email: 'foo@bar.com' }}
                />
            </MemoryRouter>,
        );
    });
    fireEvent.click(screen.getByTestId('home-btn'));
    expect(history.location.pathname).toBe('/');
});

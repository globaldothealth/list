import { act, fireEvent, render, screen } from '@testing-library/react';

import EpidNavbar from './EpidNavbar';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import { createMemoryHistory } from 'history';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    // Provide a default response for the profile fetch
    // when the component mounts.
    const axiosResponse = {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValue(axiosResponse);
});

afterEach(() => {
    jest.clearAllMocks();
});

test('renders epid brand', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/epid/i)).toBeInTheDocument();
});

test('renders login button when not logged in', async () => {
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar />
            </MemoryRouter>,
        );
    });
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
});

test('renders logout button when logged in', async () => {
    const axiosResponse = {
        data: { email: 'foo@bar.com' },
        status: 200,
        statusText: 'Forbidden',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar />
            </MemoryRouter>,
        );
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
    expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
});

test('redirects to home on click', async () => {
    const history = createMemoryHistory();
    await act(async () => {
        render(
            <MemoryRouter>
                <EpidNavbar />
            </MemoryRouter>,
        );
    });
    fireEvent.click(screen.getByTestId('home-btn'));
    expect(history.location.pathname).toBe('/');
});

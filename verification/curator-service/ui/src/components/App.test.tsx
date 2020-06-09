import App from './App';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

it('renders without crashing when logged in', () => {
    const axiosResponse = {
        data: {
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin'],
            csrfToken: 'foo',
        },
        status: 200,
        statusText: 'Forbidden',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);
    const div = document.createElement('div');
    ReactDOM.render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
        div,
    );
    expect(div.textContent).toContain('epid');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
});

it('renders without crashing when logged out', () => {
    const axiosResponse = {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValue(axiosResponse);
    const div = document.createElement('div');
    ReactDOM.render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
        div,
    );
    expect(div.textContent).toContain('epid');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
});

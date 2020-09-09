import App from './App';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios');
// Mock charts page so that requests for mongo charts are not sent
jest.mock('./Charts', () => () => <div>Test charts</div>);
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

it('renders without crashing when logged in', async () => {
    const axiosResponse = {
        data: { name: 'Alice Smith', email: 'foo@bar.com', roles: ['admin'] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);
    const { findByAltText } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
    expect(await findByAltText(/foo@bar.com/i)).toBeInTheDocument();
});

it('renders without crashing when logged out', async () => {
    const axiosResponse = {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValue(axiosResponse);
    const { findByAltText } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
});

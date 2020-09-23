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
    const { findByTestId } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
    expect(await findByTestId('profile-menu')).toBeInTheDocument();
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
    const { queryByTestId } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
    expect(queryByTestId('profile-menu')).not.toBeInTheDocument();
});

it('has drawer links', async () => {
    const axiosResponse = {
        data: { name: 'Alice Smith', email: 'foo@bar.com', roles: ['admin'] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValue(axiosResponse);
    const { findByTestId } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    );

    expect(await findByTestId('mapLink')).toHaveAttribute(
        'href',
        'http://covid-19.global.health',
    );
    expect(await findByTestId('dictionaryButton')).toHaveAttribute(
        'href',
        'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/case_fields.yaml',
    );
    expect(await findByTestId('termsButton')).toHaveAttribute('href', '/terms');
});

import * as fullCase from './fixtures/fullCase.json';

import React from 'react';
import ViewCase from './ViewCase';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

it('loads and displays case', async () => {
    const axiosResponse = {
        data: fullCase,
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText } = render(<ViewCase id="abc123" />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Female/)).toBeInTheDocument();
});

it('displays API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(<ViewCase id="abc123" />);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Request failed/)).toBeInTheDocument();
});

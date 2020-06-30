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
    // Case data.
    expect(await findByText(/5ef8e943dfe6e00030892d58/)).toBeInTheDocument();
    expect(
        await findByText(
            'https://www.colorado.gov/pacific/cdphe/news/10-new-presumptive-positive-cases-colorado-cdphe-confirms-limited-community-spread-covid-19',
        ),
    ).toBeInTheDocument();
    expect(await findByText('abc123')).toBeInTheDocument();
    expect(await findByText('2020-01-03')).toBeInTheDocument();
    // Demographics.
    expect(await findByText('Female')).toBeInTheDocument();
    expect(await findByText('50-59')).toBeInTheDocument();
    expect(await findByText('Horse breeder')).toBeInTheDocument();
    expect(await findByText('Swedish')).toBeInTheDocument();
    expect(await findByText('Asian')).toBeInTheDocument();
});

it('displays API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(<ViewCase id="abc123" />);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Request failed/)).toBeInTheDocument();
});

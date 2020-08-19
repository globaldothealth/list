import Alerts from './Alerts';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

it('loads and displays alerts', async () => {
    const response = {
        uploads: [
            {
                sourceName: 'sourceName',
                sourceUrl: 'sourceUrl',
                upload: {
                    _id: '5ef8e943dfe6e00030892d58',
                    status: 'IN_PROGRESS',
                    summary: { numCreated: 5, numUpdated: 3 },
                    created: '2020-01-01',
                },
            },
            {
                sourceName: 'sourceName',
                sourceUrl: 'sourceUrl',
                upload: {
                    _id: '5ef8e943dfe6e00030892d59',
                    status: 'IN_PROGRESS',
                    summary: { numCreated: 2 },
                    created: '2020-01-02',
                },
            },
            {
                sourceName: 'sourceName',
                sourceUrl: 'sourceUrl',
                upload: {
                    _id: '5ef8e943dfe6e00030892d60',
                    status: 'IN_PROGRESS',
                    summary: { numUpdated: 2 },
                    created: '2020-01-03',
                },
            },
        ],
    };
    const axiosResponse = {
        data: response,
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText, getByText, getAllByText } = render(<Alerts />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources/uploads');

    expect(await findByText('Alerts')).toBeInTheDocument();
    expect(getAllByText('New source verification required')).toHaveLength(3);
    expect(
        getByText('Please verify 5 cases added and 3 cases updated'),
    ).toBeInTheDocument();
    expect(getByText('2020-1-1')).toBeInTheDocument();
    expect(getByText('Please verify 2 cases added')).toBeInTheDocument();
    expect(getByText('2020-1-2')).toBeInTheDocument();
    expect(getByText('Please verify 2 cases updated')).toBeInTheDocument();
    expect(getByText('2020-1-3')).toBeInTheDocument();
});

it('loads with no alerts', async () => {
    const uploads = {
        uploads: [],
    };
    const axiosResponse = {
        data: uploads,
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText, getByText } = render(<Alerts />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources/uploads');

    expect(await findByText('Alerts')).toBeInTheDocument();
    expect(getByText('No alerts')).toBeInTheDocument();
});

it('loads with error message', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText, getByText } = render(<Alerts />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources/uploads');

    expect(await findByText('Alerts')).toBeInTheDocument();
    expect(getByText('There was an error loading alerts')).toBeInTheDocument();
});

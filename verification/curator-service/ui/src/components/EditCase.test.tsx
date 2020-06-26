import EditCase from './EditCase';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

const curator = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

it('loads and displays case to edit', async () => {
    const c = {
        _id: 'abc123',
        importedCase: {
            outcome: 'Recovered',
        },
        location: {
            country: 'France',
            geoResolution: 'Country',
        },
        events: [
            {
                name: 'confirmed',
                dateRange: {
                    start: new Date().toJSON(),
                },
            },
        ],
        symptoms: null,
        notes: 'some notes',
        sources: [
            {
                url: 'http://foo.bar',
            },
        ],
    };
    const axiosResponse = {
        data: c,
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText } = render(<EditCase id="abc123" user={curator} />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    const notes = await findByText(/some notes/);
    expect(notes).toBeInTheDocument();
});

it('displays API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(<EditCase id="abc123" user={curator} />);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    const errorMsg = await findByText(/Request failed/);
    expect(errorMsg).toBeInTheDocument();
});

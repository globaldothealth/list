import { fireEvent, render, wait } from '@testing-library/react';

import NewCaseForm from './NewCaseForm';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const user = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

afterEach(() => {
    jest.clearAllMocks();
});

it('renders form', () => {
    const { getByText, getAllByText } = render(<NewCaseForm user={user} />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();
    expect(getAllByText(/Demographics/i)).toHaveLength(2);
    expect(getAllByText(/Location/i)).toHaveLength(2);
    expect(getAllByText(/Events/i)).toHaveLength(2);
    expect(getByText(/Source URL/i)).toBeInTheDocument();
});

it('submits case ok', async () => {
    const axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.post.mockResolvedValueOnce(axiosResponse);

    const { getByText } = render(<NewCaseForm user={user} />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();

    await wait(() => {
        fireEvent.click(getByText(/Submit case/));
    });
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/cases', {
        demographics: {
            sex: undefined,
        },
        events: {
            name: 'confirmed',
            dateRange: {
                start: null,
            },
        },
        location: {
            country: '',
            geoResolution: 'Admin0',
        },
        revisionMetadata: {
            revisionNumber: 0,
            creationMetadata: {
                curator: 'foo@bar.com',
                date: expect.any(String),
            },
        },
        sources: [
            {
                url: '',
            },
        ],
        notes: '',
    });
});

it('submits case not ok', async () => {
    const { getByText } = render(<NewCaseForm user={user} />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();

    const axiosResponse = {
        message: 'Validation error: foo.bar',
    };
    mockedAxios.post.mockRejectedValueOnce(axiosResponse);

    await wait(() => {
        fireEvent.click(getByText(/Submit case/));
    });
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(getByText(/foo.bar/)).toBeDefined();
});

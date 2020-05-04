import { fireEvent, render, wait } from '@testing-library/react';

import NewCaseForm from './NewCaseForm';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
let mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
})

it('renders form', () => {
    const { getByText } = render(<NewCaseForm />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();
    expect(getByText(/Country/i)).toBeInTheDocument();
});

it('submits case ok', async () => {

    const { getByText } = render(<NewCaseForm />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();

    const axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.post.mockResolvedValueOnce(axiosResponse);

    await wait(() => {
        fireEvent.click(getByText(/Submit case/));
    })
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/cases/', {
        "demographics": {
            "sex": "",
        },
        "events": {
            "name": "confirmed",
            "date": {
                "range": {
                    "start": "",
                },
            },
        },
        "importedCase": {
            "outcome": "Pending",
        },
        "location": {
            "administrativeAreaLevel1": "",
            "administrativeAreaLevel2": "",
            "country": "",
        },
        "revisionMetadata": {
            "date": "",
            "id": 0,
            "moderator": "TODO",
        },
        "source": {
            "url": "",
        },

    });
});

it('submits case not ok', async () => {
    const { getByText } = render(<NewCaseForm />);
    expect(getByText(/Submit case/i)).toBeInTheDocument();

    const axiosResponse = {
        message: "Validation error: foo.bar",
    };
    mockedAxios.post.mockRejectedValueOnce(axiosResponse);

    await wait(() => {
        fireEvent.click(getByText(/Submit case/));
    })
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(getByText(/foo.bar/)).toBeDefined();
});
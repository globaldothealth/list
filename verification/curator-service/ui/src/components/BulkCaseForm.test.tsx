import { fireEvent, render, wait } from '@testing-library/react';

import BulkCaseForm from './BulkCaseForm';
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

it('renders csv upload widget', () => {
    const { getByLabelText } = render(<BulkCaseForm user={user} />);
    const inputField = getByLabelText(/Select CSV with case data/i);

    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('type')).toBe('file');
    expect(inputField.getAttribute('accept')).toContain('csv');
});

it('uploads case ok', async () => {
    const { getByLabelText, getByText } = render(<BulkCaseForm user={user} />);
    const inputField = getByLabelText(/Select CSV with case data/i);
    const file = new File(['a\nb'], 'data.csv', {
        type: 'text/csv',
    });
    Object.defineProperty(inputField, 'files', {
        value: [file],
    });

    const axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.put.mockResolvedValueOnce(axiosResponse);

    fireEvent.change(inputField);
    await wait(() => expect(mockedAxios.put).toHaveBeenCalledTimes(1));
    expect(getByText(/Success!/)).toBeInTheDocument();
});

it('uploads case not ok', async () => {
    const { getByLabelText, getByText } = render(<BulkCaseForm user={user} />);
    const inputField = getByLabelText(/Select CSV with case data/i);
    const file = new File(['a\nb'], 'data.csv', {
        type: 'text/csv',
    });
    Object.defineProperty(inputField, 'files', {
        value: [file],
    });

    const errorMessage = 'Upload error';
    const axiosResponse = {
        message: errorMessage,
    };
    mockedAxios.put.mockRejectedValueOnce(axiosResponse);

    fireEvent.change(inputField);
    await wait(() => expect(mockedAxios.put).toHaveBeenCalledTimes(1));
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(getByText(errorMessage)).toBeDefined();
});

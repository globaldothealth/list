import { render, wait } from '@testing-library/react';

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

beforeEach(() => {
    const axiosSourcesResponse = {
        data: { sources: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);
});

afterEach(() => {
    jest.clearAllMocks();
});

it('renders csv upload widget', async () => {
    const { getByTestId, getByText } = render(
        <BulkCaseForm
            user={user}
            onModalClose={(): void => {
                console.log('Closed!');
            }}
        />,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const inputField = getByTestId('csv-input');

    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('type')).toBe('file');
    expect(inputField.getAttribute('accept')).toContain('.csv');
    expect(getByText(/Upload cases/)).toBeInTheDocument();
});

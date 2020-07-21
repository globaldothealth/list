import {
    fireEvent,
    render,
    wait,
    waitForElementToBeRemoved,
} from '@testing-library/react';

import BulkCaseForm from './BulkCaseForm';
import { MemoryRouter } from 'react-router-dom';
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

it('renders source and csv upload widgets', async () => {
    const { getByRole, getByTestId, getByText } = render(
        <MemoryRouter>
            <BulkCaseForm
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const inputField = getByTestId('csv-input');

    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('type')).toBe('file');
    expect(inputField.getAttribute('accept')).toContain('.csv');

    const sourceComponent = getByTestId('caseReference');
    expect(getByRole('combobox')).toContainElement(sourceComponent);

    expect(getByText(/Upload cases/)).toBeInTheDocument();
});

it('displays spinner post upload', async () => {
    const { getByTestId, getByText } = render(
        <MemoryRouter>
            <BulkCaseForm
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const inputField = getByTestId('csv-input');
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
    mockedAxios.post.mockResolvedValueOnce(axiosResponse);
    mockedAxios.put.mockResolvedValueOnce(axiosResponse);

    fireEvent.change(inputField);
    fireEvent.click(getByText(/Upload cases/));
    expect(getByTestId('progress')).toBeInTheDocument();
    waitForElementToBeRemoved(() => getByTestId('progress'));
});

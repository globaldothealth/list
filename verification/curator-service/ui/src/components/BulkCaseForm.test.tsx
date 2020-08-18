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
    const { getAllByRole, getByRole, getByTestId, getByText } = render(
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

    // Header text
    expect(getByTestId('header-title')).toBeInTheDocument();
    expect(getByTestId('header-blurb')).toBeInTheDocument();

    // Source selection
    const sourceComponent = getByTestId('caseReference');
    expect(getByRole('combobox')).toContainElement(sourceComponent);

    // File upload
    const inputField = getByTestId('csv-input');
    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('type')).toBe('file');
    expect(inputField.getAttribute('accept')).toContain('.csv');

    // Reference links
    const links = getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
        'href',
        expect.stringMatching(
            /docs.google.com.*1J-C7dq1rNNV8KdE1IZ-hUR6lsz7AdlvQhx6DWp36bjE/i,
        ),
    );
    expect(links[1]).toHaveAttribute(
        'href',
        expect.stringMatching(
            /github.com\/globaldothealth\/list.*bulk-upload-process/i,
        ),
    );

    expect(getByText(/upload cases/i)).toBeEnabled();
    expect(getByText(/cancel/i)).toBeEnabled();
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
    fireEvent.click(getByText(/upload cases/i));

    expect(getByText(/upload cases/i)).toBeDisabled();
    expect(getByText(/cancel/i)).toBeDisabled();
    expect(getByTestId('progress')).toBeInTheDocument();
    expect(getByText(/uploading cases/i)).toBeInTheDocument();
    waitForElementToBeRemoved(() => getByTestId('progress'));
});

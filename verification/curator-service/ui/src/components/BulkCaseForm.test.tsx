import {
    screen,
    fireEvent,
    render,
    waitFor,
    waitForElementToBeRemoved,
} from './util/test-utils';

import BulkCaseForm from './BulkCaseForm';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    render(
        <BulkCaseForm
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    // Header text
    expect(screen.getByTestId('header-title')).toBeInTheDocument();
    expect(screen.getByTestId('header-blurb')).toBeInTheDocument();

    // Source selection
    const sourceComponent = screen.getByTestId('caseReference');
    expect(screen.getByRole('combobox')).toContainElement(sourceComponent);

    // File upload
    const inputField = screen.getByTestId('csv-input');
    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('type')).toBe('file');
    expect(inputField.getAttribute('accept')).toContain('.csv');

    // Reference links
    const links = screen.getAllByRole('link');
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

    expect(screen.getByText(/upload cases/i)).toBeEnabled();
    expect(screen.getByText(/cancel/i)).toBeEnabled();
});

it('displays spinner post upload', async () => {
    render(
        <BulkCaseForm
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const inputField = screen.getByTestId('csv-input');
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
    fireEvent.click(screen.getByText(/upload cases/i));

    expect(screen.getByText(/upload cases/i)).toBeDisabled();
    expect(screen.getByText(/cancel/i)).toBeDisabled();
    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByText(/uploading cases/i)).toBeInTheDocument();
    waitForElementToBeRemoved(() => screen.getByTestId('progress'));
});

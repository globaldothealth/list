import {
    fireEvent,
    render,
    waitFor,
    screen,
    waitForElementToBeRemoved,
} from './util/test-utils';

import AutomatedBackfill from './AutomatedBackfill';
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

it('renders form', async () => {
    render(
        <AutomatedBackfill
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

    // Date fields
    expect(
        screen.getByText('First date to backfill (inclusive)'),
    ).toBeInTheDocument();
    expect(
        screen.getByText('Last date to backfill (inclusive)'),
    ).toBeInTheDocument();

    // Buttons
    expect(screen.getByText(/backfill source/i)).toBeEnabled();
    expect(screen.getByText(/cancel/i)).toBeEnabled();
});

it('displays spinner and status post backfill', async () => {
    render(
        <AutomatedBackfill
            onModalClose={(): void => {
                return;
            }}
        />,
    );
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const startDate = screen.getByTestId('startDate').querySelector('input');
    const endDate = screen.getByTestId('endDate').querySelector('input');
    if (startDate === null || endDate === null) {
        throw Error('Unable to find date selector');
    }
    fireEvent.change(startDate, {
        target: { value: '2020/09/01' },
    });
    fireEvent.change(endDate, {
        target: { value: '2020/09/21' },
    });

    const axiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.post.mockResolvedValueOnce(axiosResponse);
    fireEvent.click(screen.getByText(/backfill source/i));

    expect(screen.getByText(/backfill source/i)).toBeDisabled();
    expect(screen.getByText(/cancel/i)).toBeDisabled();
    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.getByTestId('progressDetails')).toBeInTheDocument();
    expect(screen.getByText(/processing backfill/i)).toBeInTheDocument();
    waitForElementToBeRemoved(() => screen.getByTestId('progress'));
});

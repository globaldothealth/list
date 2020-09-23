import {
    fireEvent,
    render,
    wait,
    waitForElementToBeRemoved,
} from '@testing-library/react';

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
    const { getByTestId, getByText, getByRole } = render(
        <MemoryRouter>
            <AutomatedBackfill
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );

    // Header text
    expect(getByTestId('header-title')).toBeInTheDocument();
    expect(getByTestId('header-blurb')).toBeInTheDocument();

    // Source selection
    const sourceComponent = getByTestId('caseReference');
    expect(getByRole('combobox')).toContainElement(sourceComponent);

    // Date fields
    expect(getByText('First date to backfill (inclusive)')).toBeInTheDocument();
    expect(getByText('Last date to backfill (inclusive)')).toBeInTheDocument();

    // Buttons
    expect(getByText(/backfill source/i)).toBeEnabled();
    expect(getByText(/cancel/i)).toBeEnabled();
});

it('displays spinner post backfill', async () => {
    const { getByTestId, getByText } = render(
        <MemoryRouter>
            <AutomatedBackfill
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    const startDate = getByTestId('startDate').querySelector('input');
    const endDate = getByTestId('endDate').querySelector('input');
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
    fireEvent.click(getByText(/backfill source/i));

    expect(getByText(/backfill source/i)).toBeDisabled();
    expect(getByText(/cancel/i)).toBeDisabled();
    expect(getByTestId('progress')).toBeInTheDocument();
    expect(getByText(/retrieving source/i)).toBeInTheDocument();
    waitForElementToBeRemoved(() => getByTestId('progress'));
});

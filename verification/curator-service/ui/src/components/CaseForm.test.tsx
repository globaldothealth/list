import { fireEvent, render, wait } from '@testing-library/react';

import CaseForm from './CaseForm';
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
    const { getByText, getAllByText } = render(
        <MemoryRouter>
            <CaseForm
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(getByText(/Submit case/i)).toBeInTheDocument();
    expect(getAllByText(/Demographics/i)).toHaveLength(2);
    expect(getAllByText(/Location/i)).toHaveLength(3);
    expect(getAllByText(/Events/i)).toHaveLength(2);
    expect(getByText(/Source URL/i)).toBeInTheDocument();
    expect(getByText(/Nationality/i)).toBeInTheDocument();
});

it('can add and remove genome sequencing sections', async () => {
    const { queryByTestId, getByText } = render(
        <MemoryRouter>
            <CaseForm
                user={user}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
    await wait(() => {
        fireEvent.click(getByText(/Add genome sequence/));
    });
    expect(queryByTestId('genome-sequence-section')).toBeInTheDocument();
    await wait(() => {
        fireEvent.click(queryByTestId('remove-genome-sequence-button'));
    });
    expect(queryByTestId('genome-sequence-section')).not.toBeInTheDocument();
});

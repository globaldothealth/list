import * as fullCase from './fixtures/fullCase.json';

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
    expect(getAllByText(/Location/i)).toHaveLength(4);
    expect(getAllByText(/Events/i)).toHaveLength(2);
    expect(getByText(/Source URL/i)).toBeInTheDocument();
    expect(getByText(/Nationality/i)).toBeInTheDocument();
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

it('renders a complete case', async () => {
    const { getByText, getByDisplayValue } = render(
        <NewCaseForm user={user} initialCase={fullCase} />,
    );
    expect(getByText(/France/i)).toBeInTheDocument();
    expect(getByDisplayValue(/50/i)).toBeInTheDocument();
    expect(getByDisplayValue(/59/i)).toBeInTheDocument();
    expect(getByDisplayValue(/Female/i)).toBeInTheDocument();
    expect(getByDisplayValue(/Horse breeder/i)).toBeInTheDocument();
});

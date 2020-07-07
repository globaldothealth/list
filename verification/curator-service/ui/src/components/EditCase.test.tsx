import * as fullCase from './fixtures/fullCase.json';

import { Case } from './Case';
import EditCase from './EditCase';
import React from 'react';
import axios from 'axios';
import { render } from '@testing-library/react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
    jest.clearAllMocks();
});

const curator = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

it('loads and displays case to edit', async () => {
    const axiosCaseResponse = {
        data: fullCase,
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosSourcesResponse = {
        data: { sources: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosCaseResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);

    const { findByText, getByText, getByDisplayValue } = render(
        <EditCase id="abc123" user={curator} />,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(await findByText(/Female/)).toBeInTheDocument();
    expect(getByDisplayValue(/Horse breeder/)).toBeInTheDocument();
    expect(getByDisplayValue(/Asian/)).toBeInTheDocument();
    expect(
        getByDisplayValue('https://www.ncbi.nlm.nih.gov/nuccore/NC_045512'),
    ).toBeInTheDocument();
    expect(getByDisplayValue('NC_045512.2')).toBeInTheDocument();
    expect(getByDisplayValue('33000')).toBeInTheDocument();
    expect(getByText('France')).toBeInTheDocument();
    expect(getByText('Île-de-F')).toBeInTheDocument();
    expect(getByText('Paris')).toBeInTheDocument();
    expect(getByDisplayValue('Recovered')).toBeInTheDocument();
    expect(getByText('Severe pneumonia')).toBeInTheDocument();
    expect(getByText('United States')).toBeInTheDocument();
    expect(getByDisplayValue('Family')).toBeInTheDocument();
    // TODO: These show up locally but we need to figure out how to properly
    // query them in tests.
    //expect(await findByText(/Swedish/)).toBeInTheDocument();
    //expect(getByText('Severe acute respiratory')).toBeInTheDocument();
    // expect(
    //     getByDisplayValue('The reference sequence is identical to MN908947'),
    // ).toBeInTheDocument();
    //expect(getByText('2.35')).toBeInTheDocument();
    //expect(getByText('48.85')).toBeInTheDocument();
    //expect(getByDisplayValue('Hypertension')).toBeInTheDocument();
    //expect(getByDisplayValue('Plane')).toBeInTheDocument();
    // expect(
    //     getByDisplayValue('Contact of a confirmed case at work'),
    // ).toBeInTheDocument();
    //expect(getByDisplayValue('Vector borne')).toBeInTheDocument();
    //expect(getByDisplayValue('Gym')).toBeInTheDocument();
});

it('displays API errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Request failed'));

    const { findByText } = render(<EditCase id="abc123" user={curator} />);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    const errorMsg = await findByText(/Request failed/);
    expect(errorMsg).toBeInTheDocument();
});

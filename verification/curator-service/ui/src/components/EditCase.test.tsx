import * as fullCase from './fixtures/fullCase.json';

import { render, wait } from '@testing-library/react';

import EditCase from './EditCase';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import axios from 'axios';

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
        data: [fullCase],
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
    // This is currently called twice, because the value from the case being
    // edited is populated in the form field a split second after the page
    // initially loads (resulting in two queries: ?url={} and ?url={fullURL}).
    mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosSourcesResponse);
    const axiosSymptomsResponse = {
        data: { symptoms: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosSymptomsResponse);
    const axiosPlacesOfTransmissionResponse = {
        data: { placesOfTransmission: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosPlacesOfTransmissionResponse);
    const axiosOccupationResponse = {
        data: { occupations: [] },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosOccupationResponse);

    const { findByText, getByText, getByDisplayValue } = render(
        <MemoryRouter>
            <EditCase
                id="abc123"
                user={curator}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );
    await wait(() => expect(mockedAxios.get).toHaveBeenCalledTimes(6));
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources', {
        params: {
            url: '',
        },
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/sources', {
        params: {
            url: fullCase.caseReference.sourceUrl,
        },
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/symptoms?limit=5');
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/placesOfTransmission?limit=5',
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/occupations?limit=10',
    );
    expect(
        await findByText('Enter the details for an existing case'),
    ).toBeInTheDocument();
    expect(getByText('Submit case edit')).toBeInTheDocument();
    expect(await findByText(/Non-binary\/Third gender/)).toBeInTheDocument();
    expect(getByDisplayValue(/Horse breeder/)).toBeInTheDocument();
    expect(getByDisplayValue(/Asian/)).toBeInTheDocument();
    expect(
        getByDisplayValue('https://www.ncbi.nlm.nih.gov/nuccore/NC_045512'),
    ).toBeInTheDocument();
    expect(getByDisplayValue('NC_045512.2')).toBeInTheDocument();
    expect(getByDisplayValue('33000')).toBeInTheDocument();
    expect(getByDisplayValue('France')).toBeInTheDocument();
    expect(getByDisplayValue('Île-de-F')).toBeInTheDocument();
    expect(getByDisplayValue('Paris')).toBeInTheDocument();
    expect(getByDisplayValue('Recovered')).toBeInTheDocument();
    expect(getByText('Severe pneumonia')).toBeInTheDocument();
    expect(getByDisplayValue('United States')).toBeInTheDocument();
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

    const { findByText } = render(
        <MemoryRouter>
            <EditCase
                id="abc123"
                user={curator}
                onModalClose={(): void => {
                    return;
                }}
            />
        </MemoryRouter>,
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
    const errorMsg = await findByText(/Request failed/);
    expect(errorMsg).toBeInTheDocument();
});

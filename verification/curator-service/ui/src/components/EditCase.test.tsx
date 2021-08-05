import React from 'react';
import * as fullCase from './fixtures/fullCase.json';
import { screen, render, waitFor } from './util/test-utils';
import EditCase from './EditCase';
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

describe('<EditCase />', () => {
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
        mockedAxios.get.mockResolvedValueOnce(
            axiosPlacesOfTransmissionResponse,
        );
        const axiosOccupationResponse = {
            data: { occupations: [] },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosOccupationResponse);

        render(
            <EditCase
                id="abc123"
                onModalClose={(): void => {
                    return;
                }}
            />,
        );
        await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(6));
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
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/api/cases/symptoms?limit=5',
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/api/cases/placesOfTransmission?limit=5',
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/api/cases/occupations?limit=10',
        );
        expect(
            await screen.findByText('Enter the details for an existing case'),
        ).toBeInTheDocument();
        expect(screen.getByText('Submit case edit')).toBeInTheDocument();
        expect(
            await screen.findByText(/Non-binary\/Third gender/),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Horse breeder/)).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Asian/)).toBeInTheDocument();
        expect(
            screen.getByDisplayValue(
                'https://www.ncbi.nlm.nih.gov/nuccore/NC_045512',
            ),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('NC_045512.2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('33000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('France')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Île-de-F')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Recovered')).toBeInTheDocument();
        expect(screen.getByText('Severe pneumonia')).toBeInTheDocument();
        expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Family')).toBeInTheDocument();
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

        render(
            <EditCase
                id="abc123"
                onModalClose={(): void => {
                    return;
                }}
            />,
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/abc123');
        const errorMsg = await screen.findByText(/Request failed/);
        expect(errorMsg).toBeInTheDocument();
    });
});

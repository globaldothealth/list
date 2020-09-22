import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';

import LinelistTable from './LinelistTable';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const curator = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

afterEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.put.mockClear();
});

it('loads and displays cases', async () => {
    const cases = [
        {
            _id: 'abc123',
            importedCase: {
                outcome: 'Recovered',
            },
            caseReference: {
                sourceId: '5ef8e943dfe6e00030892d58',
                sourceUrl: 'www.example.com',
                uploadId: '012345678901234567890123',
                verificationStatus: 'VERIFIED',
            },
            demographics: { ageRange: { start: 1, end: 3 }, gender: 'Female' },
            location: {
                country: 'France',
                administrativeAreaLevel1: 'some admin 1',
                administrativeAreaLevel2: 'some admin 2',
                administrativeAreaLevel3: 'some admin 3',
                name: 'some place name',
                geometry: {
                    latitude: 42,
                    longitude: 12,
                },
                geoResolution: 'Admin3',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                    value: 'PCR test',
                },
                {
                    name: 'hospitalAdmission',
                    value: 'Yes',
                },
                {
                    name: 'outcome',
                    value: 'Recovered',
                },
            ],
            notes: 'some notes',
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'foo@bar.com',
                },
            },
        },
    ];
    const axiosResponse = {
        data: {
            cases: cases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { findByText, findByTestId } = render(
        <MemoryRouter>
            <LinelistTable
                user={curator}
                setSearchLoading={(x: boolean): void => {
                    console.log(`search loading ? ${x}`);
                }}
            />
        </MemoryRouter>,
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=50&page=1');
    expect(await findByText('www.example.com')).toBeInTheDocument();
    expect(await findByText('some admin 1')).toBeInTheDocument();
    expect(await findByText('some admin 2')).toBeInTheDocument();
    expect(await findByText('some admin 3')).toBeInTheDocument();
    expect(await findByText('France')).toBeInTheDocument();
    expect(await findByText('1-3')).toBeInTheDocument();
    expect(await findByText('Female')).toBeInTheDocument();
    expect(await findByText('Recovered')).toBeInTheDocument();
    expect(await findByTestId('verified-svg')).toBeInTheDocument();
});

it('API errors are displayed', async () => {
    const cases = [
        {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        },
    ];
    const axiosResponse = {
        data: {
            cases: cases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { getByText, findByText, getByTestId } = render(
        <MemoryRouter>
            <LinelistTable
                user={curator}
                setSearchLoading={(x: boolean): void => {
                    console.log(`search loading ? ${x}`);
                }}
            />
        </MemoryRouter>,
    );

    const row = await findByText('www.example.com');
    expect(row).toBeInTheDocument();

    // Throw error on delete request.
    mockedAxios.delete.mockRejectedValueOnce(new Error('Request failed'));

    fireEvent.click(getByTestId(/row menu/));
    fireEvent.click(getByText(/Delete/));
    fireEvent.click(getByText(/Yes/));
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

    const error = await findByText('Error: Request failed');
    expect(error).toBeInTheDocument();
});

it('can delete a row', async () => {
    const cases = [
        {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        },
    ];
    const axiosGetResponse = {
        data: {
            cases: cases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

    // Load table
    const { getByText, findByText, getByTestId } = render(
        <MemoryRouter>
            <LinelistTable
                user={curator}
                setSearchLoading={(x: boolean): void => {
                    console.log(`search loading ? ${x}`);
                }}
            />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=50&page=1');
    const row = await findByText('www.example.com');
    expect(row).toBeInTheDocument();

    // Delete case
    const axiosGetAfterDeleteResponse = {
        data: {
            cases: [],
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosDeleteResponse = {
        data: {
            case: cases[0],
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterDeleteResponse);
    mockedAxios.delete.mockResolvedValueOnce(axiosDeleteResponse);

    fireEvent.click(getByTestId(/row menu/));
    fireEvent.click(getByText(/Delete/));
    fireEvent.click(getByText(/Yes/));
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/cases/' + cases[0]._id,
    );

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const noRec = await findByText(/No records to display/);
    expect(noRec).toBeInTheDocument();
});

it('can cancel delete action', async () => {
    const cases = [
        {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        },
    ];
    const axiosGetResponse = {
        data: {
            cases: cases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

    // Load table
    const { getByText, findByText, getByTestId } = render(
        <MemoryRouter>
            <LinelistTable
                user={curator}
                setSearchLoading={(x: boolean): void => {
                    console.log(`search loading ? ${x}`);
                }}
            />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=50&page=1');
    const row = await findByText('www.example.com');
    expect(row).toBeInTheDocument();

    fireEvent.click(getByTestId(/row menu/));
    fireEvent.click(getByText(/Delete/));
    fireEvent.click(getByText(/Cancel/));
    expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
    expect(row).toBeInTheDocument();
});

it('cannot edit data if not curator', async () => {
    const cases = [
        {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
                geometry: {
                    latitude: 42,
                    longitude: 12,
                },
                name: 'France',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        },
    ];
    const axiosGetResponse = {
        data: {
            cases: cases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

    // Load table
    const { findByText, queryByTestId } = render(
        <MemoryRouter>
            <LinelistTable
                user={{
                    _id: 'testUser',
                    name: 'Alice Smith',
                    email: 'foo@bar.com',
                    roles: [],
                }}
                setSearchLoading={(x: boolean): void => {
                    console.log(`search loading ? ${x}`);
                }}
            />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=50&page=1');
    const row = await findByText('www.example.com');
    expect(row).toBeInTheDocument();

    expect(queryByTestId(/row menu/)).not.toBeInTheDocument();
});

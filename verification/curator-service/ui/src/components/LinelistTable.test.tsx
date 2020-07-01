import '@testing-library/jest-dom/extend-expect';

import { MemoryRouter, Router } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';

import LinelistTable from './LinelistTable';
import React from 'react';
import axios from 'axios';
import { createMemoryHistory } from 'history';

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
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            demographics: { ageRange: { start: 1, end: 3 } },
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

    const { findByText } = render(
        <MemoryRouter>
            <LinelistTable user={curator} />
        </MemoryRouter>,
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    expect(await findByText(/some notes/)).toBeInTheDocument();
    expect(await findByText(/some place name/)).toBeInTheDocument();
    expect(await findByText('1-3')).toBeInTheDocument();
    expect(await findByText('PCR test')).toBeInTheDocument();
    expect(await findByText('foo@bar.com')).toBeInTheDocument();
    expect(await findByText('Recovered')).toBeInTheDocument();
    expect(await findByText('Yes')).toBeInTheDocument();
});

it('redirects to new case page when + icon is clicked', async () => {
    const axiosResponse = {
        data: {
            cases: [],
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const history = createMemoryHistory();
    const { getByText } = render(
        <Router history={history}>
            <LinelistTable user={curator} />
        </Router>,
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    fireEvent.click(getByText('add'));
    expect(history.location.pathname).toBe('/cases/new');
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

    const { getByText, findByText } = render(
        <MemoryRouter>
            <LinelistTable user={curator} />
        </MemoryRouter>,
    );

    const row = await findByText(/some notes/);
    expect(row).toBeInTheDocument();

    // Throw error on delete request.
    mockedAxios.delete.mockRejectedValueOnce(new Error('Request failed'));

    const deleteButton = getByText(/delete_outline/);
    fireEvent.click(deleteButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
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
    const { getByText, findByText, queryByText } = render(
        <MemoryRouter>
            <LinelistTable user={curator} />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    const row = await findByText(/some notes/);
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

    const deleteButton = getByText(/delete_outline/);
    fireEvent.click(deleteButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
        '/api/cases/' + cases[0]._id,
    );

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const noRec = await findByText(/No records to display/);
    expect(noRec).toBeInTheDocument();
});

it('can go to page to edit a row', async () => {
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
    const history = createMemoryHistory();
    const { getByText, findByText } = render(
        <Router history={history}>
            <LinelistTable user={curator} />
        </Router>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    const row = await findByText('some notes');
    expect(row).toBeInTheDocument();

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    expect(history.location.pathname).toBe('/cases/edit/abc123');
});

it('can go to page to view a case', async () => {
    const cases = [
        {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'http://foo.bar',
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
    const history = createMemoryHistory();
    const { getByText, findByText } = render(
        <Router history={history}>
            <LinelistTable user={curator} />
        </Router>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    const row = await findByText('some notes');
    expect(row).toBeInTheDocument();

    const detailsButton = getByText(/details/);
    fireEvent.click(detailsButton);
    expect(history.location.pathname).toBe('/cases/view/abc123');
});

it('cannot edit data as a reader only', async () => {
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
    const { findByText, queryByText } = render(
        <MemoryRouter>
            <LinelistTable
                user={{
                    _id: 'testUser',
                    name: 'Alice Smith',
                    email: 'foo@bar.com',
                    roles: ['reader'],
                }}
            />
        </MemoryRouter>,
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/cases/?limit=10&page=1');
    const row = await findByText(/some notes/);
    expect(row).toBeInTheDocument();

    const deleteButton = queryByText(/delete_outline/);
    expect(deleteButton).not.toBeInTheDocument();
    const addButton = queryByText(/add_box/);
    expect(addButton).not.toBeInTheDocument();
    const editButton = queryByText(/edit/);
    expect(editButton).not.toBeInTheDocument();
});

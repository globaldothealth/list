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
            demographics: { ageRange: { start: 1, end: 3 } },
            location: {
                country: 'France',
                administrativeAreaLevel1: 'some admin 1',
                administrativeAreaLevel2: 'some admin 2',
                administrativeAreaLevel3: 'some admin 3',
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
                },
            ],
            notes: 'some notes',
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
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
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    const items = await findByText(/some notes/);
    expect(items).toBeInTheDocument();
    const admin1 = await findByText(/some admin 1/);
    expect(admin1).toBeInTheDocument();
    const ageRange = await findByText('1-3');
    expect(ageRange).toBeInTheDocument();
    const admin2 = await findByText(/some admin 2/);
    expect(admin2).toBeInTheDocument();
    const admin3 = await findByText(/some admin 3/);
    expect(admin3).toBeInTheDocument();
    const geoResolution = await findByText(/Admin3/);
    expect(geoResolution).toBeInTheDocument();
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
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    fireEvent.click(getByText('add'));
    expect(history.location.pathname).toBe('/cases/new');
});

it('API errors are displayed', async () => {
    const cases = [
        {
            _id: 'abc123',
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
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
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

    // Throw error on edit request.
    mockedAxios.put.mockRejectedValueOnce(new Error('Request failed'));

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);

    const error = await findByText('Error: Request failed');
    expect(error).toBeInTheDocument();
});

it('can delete a row', async () => {
    const cases = [
        {
            _id: 'abc123',
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
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
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
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
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
    const newRow = queryByText(/abc123/);
    expect(newRow).not.toBeInTheDocument();
});

it('can edit a row', async () => {
    const cases = [
        {
            _id: 'abc123',
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
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
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
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    const row = await findByText('some notes');
    expect(row).toBeInTheDocument();

    // Edit case
    const editedCases = [
        {
            _id: 'abc123',
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
            notes: 'some changed notes',
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
        },
    ];
    const axiosGetAfterEditResponse = {
        data: {
            cases: editedCases,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosEditResponse = {
        data: {
            case: editedCases[0],
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.put.mockResolvedValueOnce(axiosEditResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterEditResponse);

    const editButton = getByText(/edit/);
    fireEvent.click(editButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);

    // Check table data is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const oldRow = queryByText('some notes');
    expect(oldRow).not.toBeInTheDocument();
    const editedRow = await findByText('some changed notes');
    expect(editedRow).toBeInTheDocument();
});

it('cannot edit data as a reader only', async () => {
    const cases = [
        {
            _id: 'abc123',
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
            sources: [
                {
                    url: 'http://foo.bar',
                },
            ],
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
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    const row = await findByText(/some notes/);
    expect(row).toBeInTheDocument();

    const deleteButton = queryByText(/delete_outline/);
    expect(deleteButton).not.toBeInTheDocument();
    const addButton = queryByText(/add_box/);
    expect(addButton).not.toBeInTheDocument();
    const editButton = queryByText(/edit/);
    expect(editButton).not.toBeInTheDocument();
});

import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';

import LinelistTable from './LinelistTable';
import React from 'react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
            location: {
                country: 'France',
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

    const { findByText } = render(<LinelistTable />);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    const items = await findByText(/abc123/);
    expect(items).toBeInTheDocument();
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

    const { getByText, findByText } = render(<LinelistTable />);

    // Throw error on add request.
    mockedAxios.post.mockRejectedValueOnce(new Error('Request failed'));

    const addButton = getByText(/add_box/);
    fireEvent.click(addButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

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
    const { getByText, findByText, queryByText } = render(<LinelistTable />);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/cases/?limit=10&page=1&filter=',
    );
    const row = await findByText(/abc123/);
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

it('can add a row', async () => {
    const axiosGetResponse = {
        data: {
            cases: [],
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

    const { getByText, findByText, queryByText } = render(<LinelistTable />);

    // Check table is empty on load
    const row = queryByText(/abc123/);
    expect(row).not.toBeInTheDocument();

    // Add a row
    const newCase = {
        _id: 'abc123',
        demographics: {
            sex: 'Female',
        },
        location: {
            country: 'France',
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
    };
    const axiosPostResponse = {
        data: {
            case: newCase,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    const axiosGetAfterAddResponse = {
        data: {
            cases: [newCase],
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.post.mockResolvedValueOnce(axiosPostResponse);
    mockedAxios.get.mockResolvedValueOnce(axiosGetAfterAddResponse);

    const addButton = getByText(/add_box/);
    fireEvent.click(addButton);
    const confirmButton = getByText(/check/);
    fireEvent.click(confirmButton);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    // Check table is reloaded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const newRow = await findByText(/abc123/);
    expect(newRow).toBeInTheDocument();
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
    const { getByText, findByText, queryByText } = render(<LinelistTable />);
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
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some edited notes',
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
    const editedRow = await findByText('some edited notes');
    expect(editedRow).toBeInTheDocument();
});

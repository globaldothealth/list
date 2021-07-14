import '@testing-library/jest-dom/extend-expect';

import { render, fireEvent, screen, waitFor } from './util/test-utils';

import LinelistTable from './LinelistTable';
import React from 'react';
import axios from 'axios';
import range from 'lodash/range';
import userEvent from '@testing-library/user-event';
import { ChipData } from './App/App';
import { RootState } from '../redux/store';

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

const DATA_LIMIT = 10000;

const initialState: RootState = {
    app: {
        isLoading: false,
        searchQuery: '',
        filterBreadcrumbs: [],
    },
    auth: {
        isLoading: false,
        error: undefined,
        user: {
            _id: '1',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'curator'],
        },
        forgotPasswordPopupOpen: false,
        passwordReset: false,
        resetPasswordEmailSent: false,
        snackbar: {
            isOpen: false,
            message: '',
        },
    },
};

describe('<LinelistTable />', () => {
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
                demographics: {
                    ageRange: { start: 1, end: 3 },
                    gender: 'Female',
                },
                location: {
                    country: 'France',
                    administrativeAreaLevel1: 'some admin 1',
                    administrativeAreaLevel2: 'some admin 2',
                    administrativeAreaLevel3: 'some admin 3',
                    name: 'some place name',
                    geometry: {
                        latitude: 42.123421,
                        longitude: 12.376867,
                    },
                    geoResolution: 'Admin3',
                },
                events: [
                    {
                        name: 'onsetSymptoms',
                        dateRange: {
                            start: new Date(Date.UTC(2020, 10, 28)).toJSON(),
                            end: new Date(Date.UTC(2020, 10, 28)).toJSON(),
                        },
                    },
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
                        dateRange: {
                            start: new Date(Date.UTC(2020, 11, 1)).toJSON(),
                            end: new Date(Date.UTC(2020, 11, 6)).toJSON(),
                        },
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

        render(
            <LinelistTable
                page={0}
                pageSize={50}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setTotalDataCount={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,
            {
                initialState,
            },
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );

        await waitFor(() => {
            expect(screen.getByText('www.example.com')).toBeInTheDocument();
            expect(screen.getByText('some admin 1')).toBeInTheDocument();
            expect(screen.getByText('some admin 2')).toBeInTheDocument();
            expect(screen.getByText('some admin 3')).toBeInTheDocument();
            expect(screen.getByText('France')).toBeInTheDocument();
            expect(screen.getByText('42.1234')).toBeInTheDocument();
            expect(screen.getByText('12.3769')).toBeInTheDocument();
            expect(screen.getByText('1-3')).toBeInTheDocument();
            expect(screen.getByText('Female')).toBeInTheDocument();
            expect(screen.getByText('Recovered')).toBeInTheDocument();
            expect(screen.getByText('2020-11-28')).toBeInTheDocument();
            expect(
                screen.getByText('2020-12-01 - 2020-12-06'),
            ).toBeInTheDocument();
            expect(screen.getByTestId('verified-svg')).toBeInTheDocument();
        });
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

        render(
            <LinelistTable
                page={0}
                pageSize={50}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setTotalDataCount={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,

            {
                initialState,
            },
        );

        await waitFor(() => {
            expect(screen.getByText('www.example.com')).toBeInTheDocument();
        });

        // Throw error on delete request.
        mockedAxios.delete.mockRejectedValueOnce(new Error('Request failed'));

        fireEvent.click(screen.getByTestId(/row menu/));
        fireEvent.click(screen.getByText(/Delete/));
        fireEvent.click(screen.getByText(/Yes/));
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

        const error = await screen.findByText('Error: Request failed');
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
        render(
            <LinelistTable
                page={0}
                pageSize={50}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,

            {
                initialState,
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );

        await waitFor(() => {
            const row = screen.getByText('www.example.com');
            expect(row).toBeInTheDocument();
        });

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

        fireEvent.click(screen.getByTestId(/row menu/));
        fireEvent.click(screen.getByText(/Delete/));
        fireEvent.click(screen.getByText(/Yes/));
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/api/cases/' + cases[0]._id,
        );

        // Check table data is reloaded
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            expect(
                screen.getByText(/No records to display/),
            ).toBeInTheDocument();
        });
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
        render(
            <LinelistTable
                page={0}
                pageSize={50}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,

            {
                initialState,
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );

        await waitFor(() => {
            const row = screen.getByText('www.example.com');
            expect(row).toBeInTheDocument();

            fireEvent.click(screen.getByTestId(/row menu/));
            fireEvent.click(screen.getByText(/Delete/));
            fireEvent.click(screen.getByText(/Cancel/));
            expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
            expect(row).toBeInTheDocument();
        });
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
        render(
            <LinelistTable
                page={0}
                pageSize={50}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,
            {
                initialState: {
                    ...initialState,
                    auth: {
                        ...initialState.auth,
                        user: {
                            _id: 'testUser',
                            googleID: '42',
                            name: 'Alice Smith',
                            email: 'foo@bar.com',
                            roles: [],
                        },
                    },
                },
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );

        await waitFor(() => {
            expect(screen.getByText('www.example.com')).toBeInTheDocument();
        });

        expect(screen.queryByTestId(/row menu/)).not.toBeInTheDocument();
    });

    it('initializes with correct page and page size values', async () => {
        const sampleCase = {
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
        };

        // generate 20 cases for pagination purposes
        const cases = range(20).map(() => sampleCase);

        const axiosResponse = {
            data: {
                cases: cases,
                total: cases.length,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        render(
            <LinelistTable
                page={1}
                pageSize={10}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,

            {
                initialState,
            },
        );

        await waitFor(() => {
            const rowsCounter = screen.getAllByText('11-20 of 20');
            const pageSizeCounter = screen.getByText('10 rows');
            // there are two DOM elements showing number of elements
            expect(rowsCounter).toHaveLength(2);
            expect(pageSizeCounter).toBeInTheDocument();
        });
    });

    it.skip('paginates through data', async () => {
        const sampleCase = {
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
        };

        // generate 20 cases for pagination purposes
        const cases = range(20).map(() => sampleCase);

        const axiosResponse = {
            data: {
                cases: cases,
                total: cases.length,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        const changePage = jest.fn();
        const changePageSize = jest.fn();

        render(
            <LinelistTable
                page={0}
                pageSize={10}
                onChangePage={changePage}
                onChangePageSize={changePageSize}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,

            {
                initialState,
            },
        );

        await waitFor(() => {
            expect(screen.getAllByText('1-10 of 20')).toHaveLength(2);
        });

        fireEvent.click(screen.getByText('chevron_right'));

        expect(changePage).toHaveBeenCalledTimes(1);
        expect(changePage).toHaveBeenCalledWith(1);

        fireEvent.click(screen.getByText('10 rows'));

        fireEvent.click(await screen.findByText('5'));

        expect(changePageSize).toHaveBeenCalledTimes(1);
    });

    it('displays filter breadcrumbs', () => {
        const breadcrumbs: ChipData[] = [
            { key: 'country', value: 'Peru' },
            { key: 'gender', value: 'Female' },
        ];

        render(
            <LinelistTable
                page={0}
                pageSize={10}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={jest.fn()}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,
            {
                initialState: {
                    ...initialState,
                    app: {
                        ...initialState.app,
                        filterBreadcrumbs: breadcrumbs,
                    },
                },
            },
        );

        expect(screen.getByText(/filters/i)).toBeInTheDocument();
        expect(screen.getByText(/country - Peru/i)).toBeInTheDocument();
        expect(screen.getByText(/gender - Female/i)).toBeInTheDocument();
    });

    it('opens FiltersModal when filters breadcrumb is clicked', async () => {
        const breadcrumbs: ChipData[] = [
            { key: 'country', value: 'Peru' },
            { key: 'gender', value: 'Female' },
        ];

        const setFiltersModalOpen = jest.fn();

        render(
            <LinelistTable
                page={0}
                pageSize={10}
                onChangePage={jest.fn()}
                onChangePageSize={jest.fn()}
                setTotalDataCount={jest.fn()}
                handleBreadcrumbDelete={jest.fn()}
                setFiltersModalOpen={setFiltersModalOpen}
                setActiveFilterInput={jest.fn()}
                sortBy={0}
                sortByOrder={1}
                setSortBy={jest.fn()}
                setSortByOrder={jest.fn()}
            />,
            {
                initialState: {
                    ...initialState,
                    app: {
                        ...initialState.app,
                        filterBreadcrumbs: breadcrumbs,
                    },
                },
            },
        );

        const filtersBreadcrumb = screen.getByText(/filters/i);
        userEvent.click(filtersBreadcrumb);

        expect(setFiltersModalOpen).toBeCalledTimes(1);
    });
});

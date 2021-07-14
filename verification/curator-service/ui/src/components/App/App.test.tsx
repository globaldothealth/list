import App from './App';
import React from 'react';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import { render, fireEvent, screen, waitFor, within } from '../util/test-utils';
import { RootState } from '../../redux/store';

jest.mock('axios');
// Mock charts page so that requests for mongo charts are not sent
jest.mock('../Charts', () => () => <div>Test charts</div>);
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

const initialLoggedInState: RootState = {
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

describe('<App />', () => {
    it('renders without crashing when logged in', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        render(<App />);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(await screen.findByTestId('profile-menu')).toBeInTheDocument();
    });

    it('renders without crashing when logged out', async () => {
        const axiosResponse = {
            status: 403,
            statusText: 'Forbidden',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValue(axiosResponse);
        render(<App />);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument();
    });

    it('has drawer links', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValue(axiosResponse);
        render(<App />);

        expect(await screen.findByTestId('mapLink')).toHaveAttribute(
            'href',
            'https://map.covid-19.global.health/',
        );
        expect(await screen.findByTestId('dictionaryButton')).toHaveAttribute(
            'href',
            'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/functions/01-split/fields.txt',
        );
        expect(
            await screen.findByTestId('acknowledgmentsButton'),
        ).toHaveAttribute('href', 'https://global.health/acknowledgement/');
        expect(await screen.findByTestId('termsButton')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use',
        );
        expect(
            await screen.findByTestId('privacypolicybutton'),
        ).toHaveAttribute('href', 'https://global.health/privacy/');
    });

    it('navigates to the home screen (charts) after clicking on home button', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await waitFor(() => {
            expect(screen.getByText('COVID-19 Linelist')).toBeInTheDocument();
        });

        const homeButton = await screen.findByTestId('home-button-data');
        expect(homeButton).toBeInTheDocument();
        userEvent.click(homeButton);

        await waitFor(() => {
            expect(screen.getByText(/test charts/i)).toBeInTheDocument();
        });
    });

    it('opens profile menu and contains all the links', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);
        render(<App />, { initialRoute: '/cases' });

        fireEvent.click(await screen.findByTestId('profile-menu'));

        await waitFor(() => {
            const profileMenu = screen.getByTestId('profile-menu-dropdown');
            expect(profileMenu).toBeInTheDocument();

            expect(
                within(profileMenu).getByText(/Logout/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Profile/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Global.Health/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Data dictionary/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/Data acknowledgments/i),
            ).toBeInTheDocument();
            expect(
                within(profileMenu).getByText(/View source on Github/i),
            ).toBeInTheDocument();
        });
    });

    it('it opens filters modal and focuses appropriate input by clicking on column header', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await waitFor(() => {
            expect(screen.getByText(/COVID-19 Linelist/i)).toBeInTheDocument();
        });

        const columnHeader = screen.getByText(/Country/i);
        userEvent.click(columnHeader);

        await waitFor(() => {
            expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
            expect(
                screen.getByRole('textbox', { name: /country/i }),
            ).toHaveFocus();
        });
    });

    it('Should open filters modal', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        userEvent.click(screen.getByRole('button', { name: /Filter/i }));

        await waitFor(() => {
            expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
        });
    });
});

describe('Download dataset', () => {
    it('Displays download dialog after clicking DownloadButton', async () => {
        const axiosResponse = {
            data: {
                _id: '1',
                googleID: '42',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        fireEvent.click(await screen.findByText(/download dataset/i));
        expect(
            await screen.findByText(/download full dataset/i),
        ).toBeInTheDocument();
    });
});

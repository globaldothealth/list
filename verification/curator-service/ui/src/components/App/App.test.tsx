import App from '.';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import { render, fireEvent, screen, waitFor, within } from '../util/test-utils';
import { initialLoggedInState } from '../../redux/store';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

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
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else if (url.includes('/api/cases')) {
                return Promise.resolve({
                    status: 200,
                    data: { cases: [], total: 0 },
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });

        render(<App />, { initialState: initialLoggedInState });
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(mockedAxios.get).toHaveBeenCalledWith('/version');
        expect(mockedAxios.get).toHaveBeenCalledWith('/env');
        expect(mockedAxios.get).toHaveBeenCalledWith('/diseaseName');
        expect(await screen.findByTestId('profile-menu')).toBeInTheDocument();
    });

    it('renders without crashing when logged out', async () => {
        const axiosResponse = {
            status: 403,
            statusText: 'Forbidden',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
        render(<App />);
        expect(mockedAxios.get).toHaveBeenCalledTimes(5);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(mockedAxios.get).toHaveBeenCalledWith('/version');
        expect(mockedAxios.get).toHaveBeenCalledWith('/env');
        expect(mockedAxios.get).toHaveBeenCalledWith('/diseaseName');
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
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/env') {
                return Promise.resolve({ status: 200, data: 'local' });
            } else if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else if (url.includes('/api/cases')) {
                return Promise.resolve({
                    status: 200,
                    data: { cases: [], total: 0 },
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        expect(await screen.findByTestId('mapLink')).toHaveAttribute(
            'href',
            'http://dev-map.covid-19.global.health/',
        );
        expect(await screen.findByTestId('dictionaryButton')).toHaveAttribute(
            'href',
            'https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt',
        );
        expect(await screen.findByTestId('termsButton')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use',
        );
        expect(
            await screen.findByTestId('privacypolicybutton'),
        ).toHaveAttribute('href', 'https://global.health/privacy/');
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
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else if (url.includes('/api/cases')) {
                return Promise.resolve({
                    status: 200,
                    data: { cases: [], total: 0 },
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
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
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else if (url.includes('/api/cases')) {
                return Promise.resolve({
                    status: 200,
                    data: { cases: [], total: 0 },
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
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
        mockedAxios.get.mockImplementation((url) => {
            if (url === '/version') {
                return Promise.resolve({ status: 200, data: '1.10.1' });
            } else if (url === '/diseaseName') {
                return Promise.resolve({ status: 200, data: 'COVID-19' });
            } else if (url.includes('/api/cases')) {
                return Promise.resolve({
                    status: 200,
                    data: { cases: [], total: 0 },
                });
            } else {
                return Promise.resolve(axiosResponse);
            }
        });
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

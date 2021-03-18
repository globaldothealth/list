import App from './App';
import { MemoryRouter, Router } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import {
    fireEvent,
    render,
    wait,
    screen,
    within,
} from '@testing-library/react';
import { createMemoryHistory } from 'history';

jest.mock('axios');
// Mock charts page so that requests for mongo charts are not sent
jest.mock('./Charts', () => () => <div>Test charts</div>);
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('<App />', () => {
    it('renders without crashing when logged in', async () => {
        const axiosResponse = {
            data: {
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
        const { findByTestId } = render(
            <MemoryRouter>
                <App />
            </MemoryRouter>,
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(await findByTestId('profile-menu')).toBeInTheDocument();
    });

    it('renders without crashing when logged out', async () => {
        const axiosResponse = {
            data: {},
            status: 403,
            statusText: 'Forbidden',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValue(axiosResponse);
        const { queryByTestId } = render(
            <MemoryRouter>
                <App />
            </MemoryRouter>,
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(queryByTestId('profile-menu')).not.toBeInTheDocument();
    });

    it('has drawer links', async () => {
        const axiosResponse = {
            data: {
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
        const { findByTestId } = render(
            <MemoryRouter>
                <App />
            </MemoryRouter>,
        );

        expect(await findByTestId('mapLink')).toHaveAttribute(
            'href',
            'https://map.covid-19.global.health/',
        );
        expect(await findByTestId('dictionaryButton')).toHaveAttribute(
            'href',
            'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/case_fields.yaml',
        );
        expect(await findByTestId('acknowledgmentsButton')).toHaveAttribute(
            'href',
            'https://global.health/acknowledgement/',
        );
        expect(await findByTestId('termsButton')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use',
        );
        expect(await findByTestId('privacypolicybutton')).toHaveAttribute(
            'href',
            'https://global.health/privacy/',
        );
    });

    it('navigates to the home screen (charts) after clicking on home button', async () => {
        const axiosResponse = {
            data: {
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
        const history = createMemoryHistory({
            initialEntries: ['/cases'],
            initialIndex: 0,
        });

        const { getByText, findByText, findByTestId } = render(
            <Router history={history}>
                <App />
            </Router>,
        );

        expect(await findByText('COVID-19 Linelist')).toBeInTheDocument();

        fireEvent.click(await findByTestId('home-button-data'));

        wait(() => {
            expect(getByText('Cumulative')).toBeInTheDocument();
            expect(getByText('Completeness')).toBeInTheDocument();
            expect(getByText('Freshness')).toBeInTheDocument();
        });
    });

    it('opens profile menu and contains all the links', async () => {
        const axiosResponse = {
            data: {
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
        const history = createMemoryHistory({
            initialEntries: ['/cases'],
            initialIndex: 0,
        });

        render(
            <Router history={history}>
                <App />
            </Router>,
        );

        fireEvent.click(await screen.findByTestId('profile-menu'));

        await wait(() => {
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

    it('it adds the date confirmed filter by clicking on column header', async () => {
        const axiosResponse = {
            data: {
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
        const history = createMemoryHistory({
            initialEntries: ['/cases'],
            initialIndex: 0,
        });
        const { getByText, getByRole } = render(
            <Router history={history}>
                <App />
            </Router>,
        );

        wait(() => {
            const theSearchField = getByRole('textbox', { name: /searchbar/i });
            // const theSearchField = screen.getByTestId('searchbar').querySelector('input')?.value;

            console.log('theSearchField', theSearchField);

            // expect(theSearchField).toBeInTheDocument();
            // expect(screen.getByText('Confirmed date')).toBeInTheDocument();
            // expect(theSearchField).toBe(undefined);

            // fireEvent.click(screen.getByText('Confirmed date'));

            console.log('theSearchField2222222', theSearchField);

            expect(getByRole('textbox', { name: /searchbar/i })).toHaveValue(
                'gfifykfhkgfkhfk',
            );
        });
    });
});

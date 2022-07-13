import { render, screen } from '../util/test-utils';
import userEvent from '@testing-library/user-event';
import FiltersDialog from './index';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';
import { initialLoggedInState } from '../../redux/store';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();

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
});

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

describe('<FiltersDialog />', () => {
    it('Should render properly', async () => {
        const user = userEvent.setup();

        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await user.click(screen.getByRole('button', { name: /FILTER/i }));

        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();
    });

    it("Doesn't apply filters when future date is set", async () => {
        const user = userEvent.setup();

        render(<App />, {
            initialState: initialLoggedInState,
            initialRoute: '/cases',
        });

        await user.click(screen.getByRole('button', { name: /FILTER/i }));

        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();

        const date = new Date();
        // Make sure the date is always in the future for the test
        date.setDate(date.getDate() + 1);
        const futureDate = format(date, 'yyyy-MM-dd');

        const dateBeforeInput = screen.getByLabelText(/Date confirmed before/i);
        const dateAfterInput = screen.getByLabelText(/Date confirmed after/i);

        await user.type(dateBeforeInput, futureDate);
        await user.type(dateAfterInput, futureDate);

        await user.click(screen.getByRole('button', { name: 'Apply' }));

        // Check if the modal is still open
        expect(await screen.findByText(/Apply filters/i)).toBeInTheDocument();
    });
});

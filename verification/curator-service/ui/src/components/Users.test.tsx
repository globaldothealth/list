import { screen, fireEvent, render, within, waitFor } from './util/test-utils';

import Users from './Users';
import axios from 'axios';
import { initialLoggedInState } from '../redux/store';
import userEvent from '@testing-library/user-event';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

function mockGetAxios(getUsersResponse: any): void {
    mockedAxios.get.mockImplementation((url) => {
        switch (url) {
            case '/api/users/roles':
                return Promise.resolve({
                    data: { roles: ['admin', 'curator'] },
                });
            case '/api/users/':
            case '/api/users/?limit=10&page=1':
                return Promise.resolve(getUsersResponse);
            default:
                return Promise.reject();
        }
    });
}

describe('<Users />', () => {
    test('lists users', async () => {
        const users = [
            {
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
            {
                _id: 'abc321',
                name: '',
                email: 'foo2@bar.com',
                roles: ['curator'],
            },
        ];
        const axiosResponse = {
            data: {
                users: users,
                total: 2,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);

        render(<Users onUserChange={jest.fn()} />);
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
        expect(await screen.findByText('foo@bar.com')).toBeInTheDocument();
        expect(
            await screen.findByText('Name not provided'),
        ).toBeInTheDocument();
        expect(await screen.findByText('foo2@bar.com')).toBeInTheDocument();
        expect(await screen.findByText('Picture')).toBeInTheDocument();
        expect(screen.queryByText('Carol Smith')).not.toBeInTheDocument();
        expect(mockedAxios.get).toHaveBeenCalledWith(
            '/api/users/?limit=10&page=1',
        );
    });

    test('updates roles on selection', async () => {
        const users = [
            {
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin', 'curator'],
            },
        ];
        const axiosResponse = {
            data: {
                users: users,
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);

        // Shows initial roles
        render(<Users onUserChange={jest.fn()} />);
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
        expect(await screen.findByText(/admin, curator/)).toBeInTheDocument();
        expect(screen.queryByText('curator')).not.toBeInTheDocument();

        // Select new role
        const updatedUsers = [
            {
                _id: 'abc123',
                name: 'Alice Smith',
                email: 'foo@bar.com',
                roles: ['admin'],
            },
        ];
        const axiosPutResponse = {
            data: {
                users: updatedUsers,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.put.mockResolvedValueOnce(axiosPutResponse);
        fireEvent.mouseDown(
            screen.getByTestId('Alice Smith-select-roles-button'),
        );
        const listbox = within(screen.getByRole('listbox'));
        fireEvent.click(listbox.getByText(/curator/i));
        fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

        // Check roles are updated
        expect(mockedAxios.put).toHaveBeenCalledTimes(1);
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/abc123', {
            roles: ['admin'],
        });
    });

    test.skip('calls callback when user is changed', async () => {
        const user = userEvent.setup();

        const testUser = {
            _id: 'abc123',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin'],
        };
        const axiosResponse = {
            data: {
                users: [testUser],
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };

        jest.mock('@mui/material/styles');

        mockGetAxios(axiosResponse);

        let functionCalledCounter = 0;

        render(<Users onUserChange={() => functionCalledCounter++} />, {
            initialState: initialLoggedInState,
        });
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();

        const updatedUser = {
            _id: 'abc123',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'curator'],
        };
        const axiosPutResponse = {
            data: updatedUser,
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.put.mockResolvedValueOnce(axiosPutResponse);
        expect(functionCalledCounter).toBe(0);

        // Select new role
        await userEvent.click(
            screen.getByTestId('Alice Smith-select-roles-button'),
        );

        await user.click(screen.getByText(/Curator/i));
        // Awaiting this text gives time for the async functions to complete.

        screen.debug(undefined, 30000);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();

            // Check callback has been called
            expect(functionCalledCounter).toBe(1);
        });
    });

    test('callback not called when other users are changed', async () => {
        let functionCalledCounter = 0;
        const user = {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin'],
        };
        const axiosResponse = {
            data: {
                users: [user],
                total: 1,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockGetAxios(axiosResponse);

        render(
            <Users
                onUserChange={() => {
                    functionCalledCounter++;
                }}
            />,
            {
                initialState: {
                    ...initialLoggedInState,
                    auth: {
                        ...initialLoggedInState.auth,
                        user: {
                            _id: 'abc321',
                            googleID: '42',
                            name: 'Alice Smith',
                            email: 'foo@bar.com',
                            roles: ['admin'],
                        },
                    },
                },
            },
        );
        expect(await screen.findByText('Alice Smith')).toBeInTheDocument();

        const updatedUser = {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'curator'],
        };
        const axiosPutResponse = {
            data: {
                users: [updatedUser],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.put.mockResolvedValueOnce(axiosPutResponse);
        expect(functionCalledCounter).toBe(0);

        // Select new role
        fireEvent.mouseDown(
            screen.getByTestId('Alice Smith-select-roles-button'),
        );
        const listbox = within(screen.getByRole('listbox'));
        fireEvent.click(listbox.getByText(/curator/i));
        fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

        // Awaiting this text gives time for the async functions to complete.
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();

            // Check callback has not been called
            expect(functionCalledCounter).toBe(0);
        });
    });
});

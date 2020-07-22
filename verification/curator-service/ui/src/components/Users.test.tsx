import { fireEvent, render, within } from '@testing-library/react';

import React from 'react';
import Users from './Users';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const emptyUser = { _id: '', name: '', email: '', roles: [] };

beforeEach(() => {
    jest.clearAllMocks();
});

function mockGetAxios(getUsersResponse: any): void {
    mockedAxios.get.mockImplementation((url) => {
        switch (url) {
            case '/api/users/roles':
                return Promise.resolve({
                    data: { roles: ['admin', 'curator', 'reader'] },
                });
            case '/api/users/':
            case '/api/users/?limit=10&page=1':
                return Promise.resolve(getUsersResponse);
            default:
                return Promise.reject();
        }
    });
}

test('lists users', async () => {
    const users = [
        {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader'],
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

    const { queryByText, findByText } = render(
        <Users
            user={emptyUser}
            onUserChange={(): void => {
                // do nothing
            }}
        />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('foo@bar.com')).toBeInTheDocument();
    expect(await findByText('Name not provided')).toBeInTheDocument();
    expect(await findByText('foo2@bar.com')).toBeInTheDocument();
    expect(queryByText('Carol Smith')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/?limit=10&page=1');
});

test('updates roles on selection', async () => {
    const users = [
        {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader'],
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
    const { getByTestId, queryByText, findByText, getByRole } = render(
        <Users
            user={emptyUser}
            onUserChange={(): void => {
                // do nothing
            }}
        />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText(/admin, reader/)).toBeInTheDocument();
    expect(queryByText('curator')).not.toBeInTheDocument();

    // Select new role
    const updatedUsers = [
        {
            _id: 'abc123',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader', 'curator'],
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
    fireEvent.mouseDown(getByTestId('Alice Smith-select-roles-button'));
    const listbox = within(getByRole('listbox'));
    fireEvent.click(listbox.getByText(/curator/i));
    fireEvent.keyDown(getByRole('listbox'), { key: 'Escape' });

    // Check roles are updated
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/abc123', {
        roles: ['admin', 'reader', 'curator'],
    });
});

test('calls callback when user is changed', async () => {
    const user = {
        _id: 'abc123',
        name: 'Alice Smith',
        email: 'foo@bar.com',
        roles: ['admin', 'reader'],
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
    const mockCallback = jest.fn();

    const { getByTestId, findByText, getByRole } = render(
        <Users user={user} onUserChange={() => mockCallback()} />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();

    const updatedUser = {
        _id: 'abc123',
        name: 'Alice Smith',
        email: 'foo@bar.com',
        roles: ['admin', 'reader', 'curator'],
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
    expect(mockCallback).toHaveBeenCalledTimes(0);

    // Select new role
    fireEvent.mouseDown(getByTestId('Alice Smith-select-roles-button'));
    const listbox = within(getByRole('listbox'));
    fireEvent.click(listbox.getByText(/curator/i));
    fireEvent.keyDown(getByRole('listbox'), { key: 'Escape' });
    // Awaiting this text gives time for the async functions to complete.
    expect(await findByText('Alice Smith')).toBeInTheDocument();

    // Check callback has been called
    expect(mockCallback).toHaveBeenCalledTimes(1);
});

test('callback not called when other users are changed', async () => {
    let functionCalledCounter = 0;
    const user = {
        _id: 'abc123',
        name: 'Alice Smith',
        email: 'foo@bar.com',
        roles: ['admin', 'reader'],
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

    const { getByTestId, findByText, getByRole } = render(
        <Users
            user={emptyUser}
            onUserChange={() => {
                functionCalledCounter++;
            }}
        />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();

    const updatedUser = {
        _id: 'abc123',
        name: 'Alice Smith',
        email: 'foo@bar.com',
        roles: ['admin', 'reader', 'curator'],
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
    fireEvent.mouseDown(getByTestId('Alice Smith-select-roles-button'));
    const listbox = within(getByRole('listbox'));
    fireEvent.click(listbox.getByText(/curator/i));
    fireEvent.keyDown(getByRole('listbox'), { key: 'Escape' });
    // Awaiting this text gives time for the async functions to complete.
    expect(await findByText('Alice Smith')).toBeInTheDocument();

    // Check callback has not been called
    expect(functionCalledCounter).toBe(0);
});

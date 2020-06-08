import Users from './Users';
import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const emptyUser = { _id: '', name: '', email: '', roles: [] };

beforeEach(() => {
    jest.clearAllMocks();
});

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
            name: 'Bob Smith',
            email: 'foo2@bar.com',
            roles: ['curator'],
        },
    ];
    const axiosResponse = {
        data: {
            users: users,
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/users/roles') {
            return Promise.resolve({
                data: { roles: ['admin', 'curator', 'reader'] },
            });
        }
        return Promise.resolve(axiosResponse);
    });

    const { queryByText, findByText } = render(
        <Users user={emptyUser} onUserChange={() => { }} />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('Bob Smith')).toBeInTheDocument();
    expect(queryByText('Carol Smith')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/');
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
            total: 15,
        },
        status: 200,
        statusText: 'OK',
        config: {},
        headers: {},
    };
    mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/users/roles') {
            return Promise.resolve({
                data: { roles: ['admin', 'curator', 'reader'] },
            });
        }
        return Promise.resolve(axiosResponse);
    });

    // Shows initial roles
    const { getByTestId, queryByText, findByText, getByRole } = render(
        <Users user={emptyUser} onUserChange={() => { }} />,
    );
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('admin')).toBeInTheDocument();
    expect(await findByText('reader')).toBeInTheDocument();
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
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('admin')).toBeInTheDocument();
    expect(await findByText('reader')).toBeInTheDocument();
    expect(await findByText('curator')).toBeInTheDocument();
});

test('calls callback when user is changed', async () => {
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
    mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/users/roles') {
            return Promise.resolve({
                data: { roles: ['admin', 'curator', 'reader'] },
            });
        }
        return Promise.resolve(axiosResponse);
    });

    const { getByTestId, findByText, getByRole } = render(
        <Users
            user={user}
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

    // Check callback has been called
    expect(functionCalledCounter).toBe(1);
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
    mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/users/roles') {
            return Promise.resolve({
                data: { roles: ['admin', 'curator', 'reader'] },
            });
        }
        return Promise.resolve(axiosResponse);
    });

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

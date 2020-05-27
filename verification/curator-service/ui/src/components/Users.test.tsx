import Users from './Users';
import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

test('lists users', async () => {
    const users = [
        {
            _id: 'abc123',
            googleID: 'testGoogleID',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader'],
        },
        {
            _id: 'abc321',
            googleID: 'testGoogleID2',
            name: 'Bob Smith',
            email: 'foo2@bar.com',
            roles: ['curator'],
        }
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
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    const { queryByText, findByText } = render(<Users />);
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('Bob Smith')).toBeInTheDocument();
    expect(queryByText('Carol Smith')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/');
});

test('updates roles on selection', async () => {
    const users = [
        {
            _id: 'abc123',
            googleID: 'testGoogleID',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader'],
        }
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
    mockedAxios.get.mockResolvedValueOnce(axiosResponse);

    // Shows initial roles
    const { queryByText, findByText, getByRole } = render(<Users />);
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('admin')).toBeInTheDocument();
    expect(await findByText('reader')).toBeInTheDocument();
    expect(queryByText('curator')).not.toBeInTheDocument();

    // Select new role
    const updatedUsers = [
        {
            _id: 'abc123',
            googleID: 'testGoogleID',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'reader', 'curator'],
        }
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
    fireEvent.mouseDown(getByRole('button'));
    const listbox = within(getByRole('listbox'));
    fireEvent.click(listbox.getByText(/curator/i));
    fireEvent.keyDown(getByRole('listbox'), { key: 'Escape' });

    // Check roles are updated
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(await findByText('Alice Smith')).toBeInTheDocument();
    expect(await findByText('admin')).toBeInTheDocument();
    expect(await findByText('reader')).toBeInTheDocument();
    expect(await findByText('curator')).toBeInTheDocument();
});
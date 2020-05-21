import Users from './Users';
import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { shallow } from 'enzyme';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
    jest.clearAllMocks();
});

test('lists users', async () => {
    const users = [
        {
            googleID: 'testGoogleID',
            name: 'Alice Smith',
            email: 'foo@bar.com',
        },
        {
            googleID: 'testGoogleID2',
            name: 'Bob Smith',
            email: 'foo2@bar.com'
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
    mockedAxios.get.mockImplementation(() => Promise.resolve(axiosResponse));
    // Need to use shallow to wait for the component to mount.
    var wrapper = shallow(<Users />);
    const instance = wrapper.instance();
    await instance.componentDidMount();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users');
    expect(wrapper.text()).toContain('Alice Smith');
    expect(wrapper.text()).toContain('Bob Smith');
    expect(wrapper.text()).not.toContain('Carol Smith');
});
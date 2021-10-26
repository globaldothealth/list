import React from 'react';
import { render, screen, waitFor } from './util/test-utils';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import { RootState } from '../redux/store';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const initialLoggedInState: RootState = {
    app: {
        isLoading: false,
        searchQuery: '',
        filterBreadcrumbs: [],
    },
    filtersReducer: {
        countryList: [],
        error: '',
        isLoading: false,
    },
    auth: {
        isLoading: false,
        error: undefined,
        changePasswordResponse: undefined,
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

const noUserInfoState: RootState = {
    app: {
        isLoading: false,
        searchQuery: '',
        filterBreadcrumbs: [],
    },
    auth: {
        isLoading: false,
        error: undefined,
        changePasswordResponse: undefined,
        user: {
            _id: '',
            googleID: '',
            name: '',
            email: '',
            roles: [],
        },
        forgotPasswordPopupOpen: false,
        passwordReset: false,
        resetPasswordEmailSent: false,
        snackbar: {
            isOpen: false,
            message: '',
        },
    },
    filtersReducer: {
        countryList: [],
        error: '',
        isLoading: false,
    },
};

describe('<Profile />', () => {
    it('shows profile when passed user information', async () => {
        render(<Profile />, { initialState: initialLoggedInState });
        expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
        expect(screen.getByText(/admin/i)).toBeInTheDocument();
        expect(screen.getByText(/curator/i)).toBeInTheDocument();
    });

    it('shows login message when not passed user information', async () => {
        render(<Profile />, { initialState: noUserInfoState });
        expect(
            screen.getByText(/Login required to view this page/i),
        ).toBeInTheDocument();
    });

    it('checks if the old password is right', async () => {
        server.use(
            rest.post('/auth/change-password', (req, res, ctx) => {
                return res(
                    ctx.status(403),
                    ctx.json({ message: 'Old password is incorrect' }),
                );
            }),
        );
        render(<Profile />, { initialState: noUserInfoState });

        userEvent.type(screen.getByLabelText('Old Password'), '1234567');
        userEvent.type(screen.getByLabelText('New password'), 'asdD?234');
        userEvent.type(
            screen.getByLabelText('Repeat new password'),
            'asdD?234',
        );

        userEvent.click(
            screen.getByRole('button', { name: 'Change password' }),
        );

        await waitFor(
            () => {
                expect(
                    screen.getByText(/Old password is incorrect/i),
                ).toBeInTheDocument();
            },
            { timeout: 15000 },
        );
    });

    it('checks if the password was changed successfully', async () => {
        server.use(
            rest.post('/auth/change-password', (req, res, ctx) => {
                return res(
                    ctx.status(200),
                    ctx.json({ message: 'Password changed successfull' }),
                );
            }),
        );
        render(<Profile />, { initialState: noUserInfoState });

        userEvent.type(screen.getByLabelText('Old Password'), '1234567');
        userEvent.type(screen.getByLabelText('New password'), 'asdD?234');
        userEvent.type(
            screen.getByLabelText('Repeat new password'),
            'asdD?234',
        );

        userEvent.click(
            screen.getByRole('button', { name: 'Change password' }),
        );

        await waitFor(
            () => {
                expect(
                    screen.getByText(/Password changed successfull/i),
                ).toBeInTheDocument();
            },
            { timeout: 15000 },
        );
    });
});

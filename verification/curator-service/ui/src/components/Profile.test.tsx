import React from 'react';
import { render, screen, waitFor } from './util/test-utils';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import { RootState, initialLoggedInState } from '../redux/store';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const loggedInWithApiKeyState: RootState = {
    ...initialLoggedInState,
    auth: {
        ...initialLoggedInState.auth,
        user: {
            _id: '1',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: ['admin', 'curator'],
            apiKey: 'An API Key',
        },
    },
};

const noUserInfoState: RootState = {
    ...initialLoggedInState,
    auth: {
        ...initialLoggedInState.auth,
        user: {
            _id: '',
            googleID: '',
            name: '',
            email: '',
            roles: [],
        },
    },
};

describe('<Profile />', () => {
    it('shows profile when passed user information', async () => {
        render(<Profile />, { initialState: initialLoggedInState });
        expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
        expect(screen.getByText(/foo@bar.com/i)).toBeInTheDocument();
        expect(screen.getByText(/admin/i)).toBeInTheDocument();
        expect(screen.getByText(/curator/i)).toBeInTheDocument();
        expect(
            screen.getByText(/You have yet to set an API key/i),
        ).toBeInTheDocument();
    });

    it('shows API key when the user has one', async () => {
        render(<Profile />, { initialState: loggedInWithApiKeyState });
        expect(screen.getByText(/API Key: An API Key/i)).toBeInTheDocument();
    });

    it('resets the API key on request', async () => {
        server.use(
            rest.post('/auth/profile/apiKey', (req, res, ctx) => {
                return res(ctx.status(201));
            }),
        );

        server.use(
            rest.get('/auth/profile', (req, res, ctx) => {
                return res(
                    ctx.status(200),
                    ctx.json(loggedInWithApiKeyState.auth.user),
                );
            }),
        );
        render(<Profile />, { initialState: initialLoggedInState });
        userEvent.click(screen.getByRole('button', { name: 'Reset API Key' }));
        await waitFor(
            () => {
                expect(
                    screen.getByText(/API Key: An API Key/i),
                ).toBeInTheDocument();
            },
            { timeout: 15000 },
        );
    });

    it('shows login message when not passed user information', async () => {
        render(<Profile />, { initialState: noUserInfoState });
        expect(
            screen.getByText(/Login required to view this page/i),
        ).toBeInTheDocument();
    });

    it('checks if the old password is right', async () => {
        const user = userEvent.setup();

        server.use(
            rest.post('/auth/change-password', (req, res, ctx) => {
                return res(
                    ctx.status(403),
                    ctx.json({ message: 'Old password is incorrect' }),
                );
            }),
        );
        render(<Profile />, { initialState: noUserInfoState });

        await user.type(screen.getByLabelText('Old Password'), '1234567');
        await user.type(screen.getByLabelText('New password'), 'asdD?234');
        await user.type(
            screen.getByLabelText('Repeat new password'),
            'asdD?234',
        );

        await user.click(
            screen.getByRole('button', { name: 'Change password' }),
        );

        expect(
            await screen.findByText(/Old password is incorrect/i),
        ).toBeInTheDocument();
    });

    it('checks if the password was changed successfully', async () => {
        const user = userEvent.setup();

        server.use(
            rest.post('/auth/change-password', (req, res, ctx) => {
                return res(
                    ctx.status(200),
                    ctx.json({ message: 'Password changed successfully' }),
                );
            }),
        );

        render(<Profile />, { initialState: noUserInfoState });

        await user.type(screen.getByLabelText('Old Password'), '1234567');
        await user.type(screen.getByLabelText('New password'), 'asdD?234');
        await user.type(
            screen.getByLabelText('Repeat new password'),
            'asdD?234',
        );

        await user.click(
            screen.getByRole('button', { name: 'Change password' }),
        );

        expect(
            await screen.findByText(/Password changed successfully/i),
        ).toBeInTheDocument();
    });
});

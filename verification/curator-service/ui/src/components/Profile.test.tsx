import React from 'react';
import { render, screen } from './util/test-utils';
import Profile from './Profile';
import { RootState } from '../redux/store';

const initialLoggedInState: RootState = {
    app: {
        isLoading: false,
        searchQuery: '',
        filterBreadcrumbs: [],
    },
    auth: {
        isLoading: false,
        error: undefined,
        user: {
            id: '1',
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
        user: {
            id: '',
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
});

import React from 'react';
import AutomatedSourceForm from './AutomatedSourceForm';
import { screen, render } from './util/test-utils';
import { RootState } from '../redux/store';

const user = {
    _id: 'testUser',
    googleID: '42',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

const initialLoggedInState: RootState = {
    app: {
        isLoading: false,
        searchQuery: '',
        filterBreadcrumbs: [],
        version: '1.0',
        env: 'local',
    },
    filters: {
        countryList: [],
        error: '',
        isLoading: false,
    },
    auth: {
        isLoading: false,
        error: undefined,
        changePasswordResponse: undefined,
        user,
        forgotPasswordPopupOpen: false,
        passwordReset: false,
        resetPasswordEmailSent: false,
        snackbar: {
            isOpen: false,
            message: '',
        },
    },
    acknowledgment: {
        isLoading: false,
        error: undefined,
        acknowledgmentData: [],
        totalSources: 0,
        nextPage: 1,
    },
};

describe('<AutomatedSourceForm />', () => {
    it('renders form', async () => {
        render(
            <AutomatedSourceForm
                onModalClose={(): void => {
                    return;
                }}
            />,
            { initialState: initialLoggedInState },
        );

        // Header text
        expect(screen.getByTestId('header-title')).toBeInTheDocument();
        expect(screen.getByTestId('header-blurb')).toBeInTheDocument();

        // Source fields
        expect(screen.getByTestId('name')).toBeInTheDocument();
        expect(screen.getByTestId('url')).toBeInTheDocument();
        expect(screen.getByTestId('format')).toBeInTheDocument();
        expect(screen.getByTestId('recipients')).toBeInTheDocument();
        expect(screen.getByTestId('excludeFromLineList')).toBeInTheDocument();
        expect(screen.getByTestId('hasStableIdentifiers')).toBeInTheDocument();
        expect(screen.getByTestId('providerName')).toBeInTheDocument();
        expect(screen.getByTestId('providerWebsiteUrl')).toBeInTheDocument();
        // Buttons
        expect(screen.getByText(/create source/i)).toBeEnabled();
        expect(screen.getByText(/cancel/i)).toBeEnabled();
    });
});

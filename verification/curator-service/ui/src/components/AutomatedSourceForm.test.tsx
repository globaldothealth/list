import React from 'react';
import AutomatedSourceForm from './AutomatedSourceForm';
import { screen, render } from './util/test-utils';
import { initialLoggedInState } from '../redux/store';

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

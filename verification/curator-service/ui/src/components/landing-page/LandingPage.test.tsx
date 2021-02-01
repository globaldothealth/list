import LandingPage from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const setUser = jest.fn();

describe('LandingPage', () => {
    test('shows all content', async () => {
        render(
            <MemoryRouter>
                <LandingPage setUser={setUser} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Detailed line list data/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to G.h Data/)).toBeInTheDocument();
        expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
        expect(screen.getByText(/Or sign in with email/)).toBeInTheDocument();
        expect(
            screen.getByText(
                /By creating an account, I accept the Global.health TOS and Privacy Policy, and agree to be added to the newsletter/,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Global.health map')).toHaveAttribute(
            'href',
            'http://covid-19.global.health/',
        );
        expect(screen.getByText('Data dictionary')).toHaveAttribute(
            'href',
            'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/case_fields.yaml',
        );
        expect(screen.getByText('Terms of use')).toHaveAttribute(
            'href',
            '/terms',
        );

        const privacyPolicyBtn = screen.getByText(
            'Privacy policy',
        ) as HTMLAnchorElement;
        const cookiePolicyBtn = screen.getByText(
            'Cookie policy',
        ) as HTMLAnchorElement;

        expect(privacyPolicyBtn.href).toContain(
            'https://www.iubenda.com/privacy-policy',
        );

        expect(cookiePolicyBtn.href).toContain(
            'https://www.iubenda.com/privacy-policy',
        );
        expect(cookiePolicyBtn.href).toContain('cookie-policy');
    });
});

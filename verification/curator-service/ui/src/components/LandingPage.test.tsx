import LandingPage from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { render } from '@testing-library/react';

test('shows all content', async () => {
    const { getByText } = render(
        <MemoryRouter>
            <LandingPage />
        </MemoryRouter>,
    );

    expect(getByText(/Detailed line list data/)).toBeInTheDocument();
    expect(getByText(/Welcome to G.h List/)).toBeInTheDocument();
    expect(getByText('Login to get started')).toBeInTheDocument();
    expect(getByText('Global.health map')).toHaveAttribute(
        'href',
        'http://covid-19.global.health/',
    );
    expect(getByText('Data dictionary')).toHaveAttribute(
        'href',
        'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/case_fields.yaml',
    );
    expect(getByText('Terms of use')).toHaveAttribute('href', '/terms');

    const privacyPolicyBtn = getByText('Privacy policy') as HTMLAnchorElement;
    const cookiePolicyBtn = getByText('Cookie policy') as HTMLAnchorElement;

    expect(privacyPolicyBtn.href).toContain(
        'https://www.iubenda.com/privacy-policy',
    );

    expect(cookiePolicyBtn.href).toContain(
        'https://www.iubenda.com/privacy-policy',
    );
    expect(cookiePolicyBtn.href).toContain('cookie-policy');
});

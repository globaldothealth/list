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

    expect(getByText(/Trustworthy line list data/)).toBeInTheDocument();
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
});

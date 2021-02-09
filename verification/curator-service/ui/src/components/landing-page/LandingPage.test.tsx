import LandingPage from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const setUser = jest.fn();

const theme = createMuiTheme({
    custom: { palette: { landingPage: { descriptionTextColor: '#838D89' } } },
});

describe('LandingPage', () => {
    test('shows all content', async () => {
        render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <LandingPage setUser={setUser} />
                </ThemeProvider>
            </MemoryRouter>,
        );

        expect(screen.getByText(/Detailed line list data/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to G.h Data/)).toBeInTheDocument();
        expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
        expect(screen.getByText(/Or sign in with email/)).toBeInTheDocument();

        const tosMessage = screen.getByText((content, node) => {
            const hasText = (node: Node) =>
                node.textContent ===
                'By creating an account, I accept the Global.health Terms of Use and Privacy Policy, and agree to be added to the newsletter';
            const nodeHasText = hasText(node);
            const childrenDontHaveText = Array.from(node.children).every(
                (child) => !hasText(child),
            );

            return nodeHasText && childrenDontHaveText;
        });

        expect(tosMessage).toBeInTheDocument();
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
            'https://test-globalhealth.pantheonsite.io/terms-of-use/',
        );
        expect(screen.getByText('Privacy policy')).toHaveAttribute(
            'href',
            'https://test-globalhealth.pantheonsite.io/privacy/',
        );

        const cookiePolicyBtn = screen.getByText(
            'Cookie policy',
        ) as HTMLAnchorElement;

        expect(cookiePolicyBtn.href).toContain(
            'https://www.iubenda.com/privacy-policy',
        );
        expect(cookiePolicyBtn.href).toContain('cookie-policy');

        // Check partners logos
        expect(
            screen.getByText(/Participating Institutions:/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/With funding from:/i)).toBeInTheDocument();
        expect(screen.getAllByAltText(/Partner logo/i)).toHaveLength(10);
    });
});

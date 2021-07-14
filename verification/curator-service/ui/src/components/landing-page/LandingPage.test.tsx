import LandingPage from './LandingPage';
import React from 'react';
import { render, screen, waitFor } from '../util/test-utils';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
// import ChangePasswordForm from './ChangePasswordForm';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom/extend-expect';
import { Route } from 'react-router-dom';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('<LandingPage />', () => {
    test('shows all content', async () => {
        render(<LandingPage />);

        expect(screen.getByText(/Detailed line list data/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to G.h Data/)).toBeInTheDocument();
        expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
        expect(
            screen.getByText(/Sign in with username and password/),
        ).toBeInTheDocument();
        expect(screen.getByText(/Don't have an account?/)).toBeInTheDocument();
        expect(
            screen.getByText(
                /I agree to be added to the Global.health newsletter/i,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Global.health website')).toHaveAttribute(
            'href',
            'https://global.health/',
        );
        expect(screen.getByText('Global.health map')).toHaveAttribute(
            'href',
            'https://map.covid-19.global.health/',
        );
        expect(screen.getByText('Data dictionary')).toHaveAttribute(
            'href',
            'https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/functions/01-split/fields.txt',
        );
        expect(screen.getByText('Data acknowledgments')).toHaveAttribute(
            'href',
            'https://global.health/acknowledgement/',
        );
        expect(screen.getByText('Terms of use')).toHaveAttribute(
            'href',
            'https://global.health/terms-of-use/',
        );
        expect(screen.getByText('Privacy policy')).toHaveAttribute(
            'href',
            'https://global.health/privacy/',
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

describe('<SignInForm />', () => {
    it('renders and submits form', async () => {
        server.use(
            rest.post('/auth/signin', (req, res, ctx) => {
                return res(
                    ctx.status(403),
                    ctx.json({ message: 'Wrong username or password' }),
                );
            }),
        );

        render(<LandingPage />);

        userEvent.type(screen.getByLabelText(/Email/i), 'test@email.com');
        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.type(screen.getByLabelText('Password'), '1234567');
        userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(
            () => {
                expect(
                    screen.getByText(/Wrong username or password/i),
                ).toBeInTheDocument();
            },
            { timeout: 15000 },
        );
    });

    test('displays verification errors when checkbox is not checked', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.type(screen.getByRole('textbox'), 'test@email.com');
        userEvent.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                2,
            );
        });
    });

    test('displays verification errors when email input is empty', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/Required/i)).toHaveLength(2);
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.type(screen.getByRole('textbox'), 'incorrectemail');
        userEvent.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when both email, password and agreement checkbox are empty', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(3);
        });
    });
});

describe('<SignUpForm />', () => {
    test('checks if the signup form is displayed', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );
        expect(screen.getByText(/SignUp form/)).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Repeat password')).toBeInTheDocument();
    });

    test('checks emails match', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Email'), 'test@email.com');
        userEvent.type(screen.getByLabelText(/Confirm Email/), 'xxx@email.com');
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getByText('Emails must match')).toBeInTheDocument();
        });
    });

    test('checks passwords match', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Password'), '12345');
        userEvent.type(screen.getByLabelText(/Repeat password/), '6789');
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when checkbox is not checked', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Email'), 'test@email.com');
        userEvent.type(
            screen.getByLabelText(/Confirm Email/),
            'test@email.com',
        );
        userEvent.type(screen.getByLabelText('Password'), '12345');
        userEvent.type(screen.getByLabelText(/Repeat password/), '12345');
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                1,
            );
        });
    });

    test('displays verification errors when email confirmation input is empty', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Email'), 'test@email.com');
        userEvent.type(screen.getByLabelText('Password'), '12345');
        userEvent.type(screen.getByLabelText(/Repeat password/), '12345');
        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/Emails must match/i)).toHaveLength(1);
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Email'), 'incorrectemail');
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when password is empty', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.type(screen.getByLabelText('Email'), 'test@email.com');
        userEvent.type(
            screen.getByLabelText(/Confirm Email/),
            'test@email.com',
        );
        userEvent.type(screen.getByLabelText(/Repeat password/), '12345');
        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(
                screen.getByText(/This field is required/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Passwords must match/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when both email, password and agreement checkbox are empty', async () => {
        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        userEvent.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(3);
        });
    });
});

describe('<ForgotPasswordForm />', () => {
    test('displays the forgot password link', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        expect(screen.getByText(/Forgot your password?/i)).toBeInTheDocument();
    });

    test('displays the forgot password window', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getByTestId('forgot-password-link'));

        expect(
            screen.getByTestId('forgot-password-dialog'),
        ).toBeInTheDocument();
    });

    test('displays verification errors when email is incorrect', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getByTestId('forgot-password-link'));
        userEvent.type(screen.getByRole('textbox'), 'incorrectemail');
        userEvent.click(screen.getByTestId('send-reset-link'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when email is empty', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getByTestId('forgot-password-link'));
        userEvent.click(screen.getByTestId('send-reset-link'));

        await waitFor(() => {
            expect(
                screen.getByText(/This field is required/i),
            ).toBeInTheDocument();
        });
    });
});

describe('<ChangePasswordForm />', () => {
    test('displays the change password form', async () => {
        render(
            <Route exact path="/reset-password/:token/:id">
                <LandingPage />
            </Route>,
            { initialRoute: '/reset-password/token/id' },
        );

        expect(screen.getByText('Choose a new password')).toBeInTheDocument();
    });

    test('displays verification errors when password is empty', async () => {
        render(
            <Route exact path="/reset-password/:token/:id">
                <LandingPage />
            </Route>,
            { initialRoute: '/reset-password/token/id' },
        );

        userEvent.click(screen.getByTestId('change-password-button'));

        await waitFor(() => {
            expect(
                screen.getByText('This field is required'),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when confirm password is empty', async () => {
        render(
            <Route exact path="/reset-password/:token/:id">
                <LandingPage />
            </Route>,
            { initialRoute: '/reset-password/token/id' },
        );

        userEvent.type(screen.getByLabelText('Password'), '12345');
        userEvent.click(screen.getByTestId('change-password-button'));

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });
});

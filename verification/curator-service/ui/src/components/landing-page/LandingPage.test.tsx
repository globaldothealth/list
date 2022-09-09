import LandingPage from './LandingPage';
import { render, screen, waitFor } from '../util/test-utils';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Route } from 'react-router-dom';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock('react-google-recaptcha', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    const RecaptchaV2 = forwardRef((props: any, ref: any) => {
        useImperativeHandle(ref, () => ({
            reset: jest.fn(),
            execute: jest.fn(),
            executeAsync: jest.fn(
                () => '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
            ),
        }));
        return (
            <input
                ref={ref}
                type="checkbox"
                data-testid="mock-v2-captcha-element"
                {...props}
            />
        );
    });

    return RecaptchaV2;
});

describe('<LandingPage />', () => {
    test('shows all content', async () => {
        render(<LandingPage />);

        expect(screen.getByText(/Detailed line list data/)).toBeInTheDocument();
        expect(screen.getByText(/Welcome to G.h Data/)).toBeInTheDocument();
        expect(screen.getByText(/Sign in with Google/)).toBeInTheDocument();
        expect(screen.getByText(/Sign up form/)).toBeInTheDocument();
        expect(
            screen.getByText(/Already have an account?/),
        ).toBeInTheDocument();
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
            'https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt',
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
        expect(screen.getAllByAltText(/Partner logo/i)).toHaveLength(11);
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

        const user = userEvent.setup();

        render(<LandingPage />);

        // Go to sign in form
        userEvent.click(screen.getByText('Sign in!'));
        expect(
            await screen.findByText(/Sign in with username and password/i),
        ).toBeInTheDocument();

        // Fill out the form
        await user.type(screen.getByLabelText('Email'), 'test@email.com');
        await user.type(screen.getByLabelText('Password'), '1234567');
        await user.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(
                screen.getByText(/Wrong username or password/i),
            ).toBeInTheDocument();
        });
    });

    it('displays verification errors when email input is empty', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        userEvent.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                2,
            );
        });
    });

    it('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await user.type(screen.getByRole('textbox'), 'incorrectemail');
        await user.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    it('displays verification errors when both email and password are empty', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await user.click(screen.getByTestId('sign-in-button'));

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(2);
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
        expect(screen.getByText(/Sign up form/)).toBeInTheDocument();
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Password *')).toBeInTheDocument();
        expect(screen.getByLabelText('Repeat password *')).toBeInTheDocument();
    });

    test('checks emails match', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Email *'), 'test@email.com');
        await user.type(
            screen.getByLabelText(/Confirm Email \*/),
            'xxx@email.com',
        );
        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getByText('Emails must match')).toBeInTheDocument();
        });
    });

    test('checks passwords match', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Password *'), '12345');
        await user.type(screen.getByLabelText(/Repeat password \*/), '6789');
        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when checkbox is not checked', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Email *'), 'test@email.com');
        await user.type(
            screen.getByLabelText(/Confirm Email \*/),
            'test@email.com',
        );
        await user.type(screen.getByLabelText('Password *'), '12345');
        await user.type(screen.getByLabelText(/Repeat password \*/), '12345');
        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/This field is required/i)).toHaveLength(
                1,
            );
        });
    });

    test('displays verification errors when email confirmation input is empty', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Email *'), 'test@email.com');
        await user.type(screen.getByLabelText('Password *'), '12345');
        await user.type(screen.getByLabelText(/Repeat password \*/), '12345');
        await user.click(screen.getAllByRole('checkbox')[0]);
        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(screen.getAllByText(/Emails must match/i)).toHaveLength(1);
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Email *'), 'incorrectemail');
        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when password in SignUp form is empty', async () => {
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.type(screen.getByLabelText('Email *'), 'test@email.com');
        await user.type(
            screen.getByLabelText(/Confirm Email \*/),
            'test@email.com',
        );
        await user.type(screen.getByLabelText(/Repeat password \*/), '12345');
        await user.click(screen.getAllByRole('checkbox')[0]);
        await user.click(screen.getByTestId('sign-up-button'));

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
        const user = userEvent.setup();

        render(
            <SignUpForm
                setRegistrationScreenOn={() => true}
                disabled={false}
            />,
        );

        await user.click(screen.getByTestId('sign-up-button'));

        await waitFor(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(4);
        });
    });
});

describe('<ForgotPasswordForm />', () => {
    test('displays the forgot password link', async () => {
        render(<SignInForm setRegistrationScreenOn={() => false} />);

        expect(screen.getByText(/Forgot your password?/i)).toBeInTheDocument();
    });

    test('displays the forgot password window', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await user.click(screen.getByTestId('forgot-password-link'));

        expect(
            screen.getByTestId('forgot-password-dialog'),
        ).toBeInTheDocument();
    });

    test('displays verification errors when email is incorrect', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await user.click(screen.getByTestId('forgot-password-link'));
        await user.type(screen.getByRole('textbox'), 'incorrectemail');
        await user.click(screen.getByTestId('send-reset-link'));

        await waitFor(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
        });
    });

    test('displays verification errors when email is empty', async () => {
        const user = userEvent.setup();

        render(<SignInForm setRegistrationScreenOn={() => false} />);

        await user.click(screen.getByTestId('forgot-password-link'));
        await user.click(screen.getByTestId('send-reset-link'));

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

    test('displays verification errors when password in ChangePassword form is empty', async () => {
        const user = userEvent.setup();

        render(
            <Route exact path="/reset-password/:token/:id">
                <LandingPage />
            </Route>,
            { initialRoute: '/reset-password/token/id' },
        );

        await user.click(screen.getByTestId('change-password-button'));

        await waitFor(() => {
            expect(screen.getByText('Required!')).toBeInTheDocument();
        });
    });

    test('displays verification errors when confirm password is empty', async () => {
        const user = userEvent.setup();

        render(
            <Route exact path="/reset-password/:token/:id">
                <LandingPage />
            </Route>,
            { initialRoute: '/reset-password/token/id' },
        );

        await user.type(screen.getByLabelText('Password'), '12345');
        await user.click(screen.getByTestId('change-password-button'));

        await waitFor(() => {
            expect(
                screen.getByText('Passwords must match'),
            ).toBeInTheDocument();
        });
    });
});

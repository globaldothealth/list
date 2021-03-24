import React from 'react';
import SignInForm from './SignInForm';
import { render, screen, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('SignInForm', () => {
    const setIsAgreementChecked = jest.fn();
    const setIsAgreementMessage = jest.fn();
    const setIsNewsletterChecked = jest.fn();

    test('renders and submits form', async () => {
        const handleSubmit = jest.fn();

        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={false}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        userEvent.type(screen.getByRole('textbox'), 'test@email.com');
        userEvent.click(screen.getAllByRole('checkbox')[0]);

        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            expect(handleSubmit).toHaveBeenCalledWith(
                'test@email.com',
                expect.any(Function),
            );
        });
    });

    test('displays verification errors when checkbox is not checked', async () => {
        const handleSubmit = jest.fn();
        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={false}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        userEvent.type(screen.getByRole('textbox'), 'test@email.com');
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            expect(
                screen.getByText(/This agreement is required/i),
            ).toBeInTheDocument();
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('displays verification errors when email input is empty', async () => {
        const handleSubmit = jest.fn();
        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={false}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            expect(screen.getByText(/Required/i)).toBeInTheDocument();
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        const handleSubmit = jest.fn();
        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={false}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        userEvent.type(screen.getByRole('textbox'), 'incorrectemail');
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            expect(
                screen.getByText(/Invalid email address/i),
            ).toBeInTheDocument();
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('displays verification errors when both email and agreement checkbox are empty', async () => {
        const handleSubmit = jest.fn();
        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={false}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(2);
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('shows loading indicator when form is submitting', () => {
        const handleSubmit = jest.fn();
        render(
            <SignInForm
                handleSubmit={handleSubmit}
                setIsAgreementChecked={setIsAgreementChecked}
                setIsAgreementMessage={setIsAgreementMessage}
                isAgreementChecked={false}
                isAgreementMessage={false}
                isSubmitting={true}
                isNewsletterChecked={false}
                setIsNewsletterChecked={setIsNewsletterChecked}
                classes={{
                    emailField: '',
                    loader: '',
                    signInButton: '',
                    divider: '',
                }}
            />,
        );

        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
});

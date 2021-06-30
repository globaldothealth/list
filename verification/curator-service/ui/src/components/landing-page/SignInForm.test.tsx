import React from 'react';
import SignInForm from './SignInForm';
import { render, screen, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe.skip('SignInForm', () => {
    test('renders and submits form', async () => {
        const handleSubmit = jest.fn();

        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

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
        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

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
        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

        userEvent.click(screen.getAllByRole('checkbox')[0]);
        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            expect(screen.getByText(/Required/i)).toBeInTheDocument();
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('displays verification errors when email is incorrect', async () => {
        const handleSubmit = jest.fn();
        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

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
        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

        userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await wait(() => {
            const errorMessages = screen.getAllByText(/required/i);
            expect(errorMessages).toHaveLength(2);
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('shows loading indicator when form is submitting', () => {
        render(<SignInForm setRegistrationScreenOn={jest.fn} />);

        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
});

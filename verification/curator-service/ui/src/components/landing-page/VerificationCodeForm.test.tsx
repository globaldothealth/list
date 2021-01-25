import React from 'react';
import VerificationCodeForm from './VerificationCodeForm';
import { render, screen, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('VerificationCodeForm', () => {
    const setWrongCodeMessage = jest.fn();

    test('renders and submits form', async () => {
        const handleSubmit = jest.fn();

        render(
            <VerificationCodeForm
                handleSubmit={handleSubmit}
                setWrongCodeMessage={setWrongCodeMessage}
                wrongCodeMessage={false}
                isSubmitting={false}
                classes={{ emailField: '', loader: '', signInButton: '' }}
            />,
        );

        userEvent.type(screen.getByRole('textbox'), '1234');
        userEvent.click(screen.getByRole('button', { name: /submit/i }));

        await wait(() => {
            expect(handleSubmit).toHaveBeenCalledWith('1234');
        });
    });

    test('displays validation errors', async () => {
        const handleSubmit = jest.fn();

        render(
            <VerificationCodeForm
                handleSubmit={handleSubmit}
                setWrongCodeMessage={setWrongCodeMessage}
                wrongCodeMessage={false}
                isSubmitting={false}
                classes={{ emailField: '', loader: '', signInButton: '' }}
            />,
        );

        userEvent.click(screen.getByRole('button', { name: /submit/i }));

        await wait(() => {
            expect(screen.getByText(/required/i)).toBeInTheDocument();
            expect(handleSubmit).not.toHaveBeenCalled();
        });
    });

    test('displays loading indicator when form is submitting', () => {
        const handleSubmit = jest.fn();

        render(
            <VerificationCodeForm
                handleSubmit={handleSubmit}
                setWrongCodeMessage={setWrongCodeMessage}
                wrongCodeMessage={false}
                isSubmitting={true}
                classes={{ emailField: '', loader: '', signInButton: '' }}
            />,
        );

        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
});

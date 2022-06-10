import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen, render, waitFor } from './util/test-utils';
import { Button } from '@mui/material';
import DataGuideDialog from './DataGuideDialog';

const SearchGuideTestCase = ({ defaultOpen = false }): JSX.Element => {
    const [isOpen, setIsOpen] = React.useState<boolean>(defaultOpen);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const toggleDialog = (): void => setIsOpen((isOpen) => !isOpen);

    return (
        <div ref={rootRef}>
            <Button ref={buttonRef} onClick={toggleDialog}>
                Open
            </Button>
            <DataGuideDialog
                isOpen={isOpen}
                onToggle={toggleDialog}
                rootComponentRef={rootRef}
                triggerComponentRef={buttonRef}
            />
        </div>
    );
};

it('opens properly after clicking on button', async () => {
    const user = userEvent.setup();

    render(<SearchGuideTestCase />);

    expect(
        screen.queryByText(/Welcome to Global.health Data!/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('Open'));

    waitFor(() => {
        expect(
            screen.queryByText(/Welcome to Global.health Data!/i),
        ).toBeInTheDocument();
    });
});

it('closes properly after clicking on close button', async () => {
    const user = userEvent.setup();

    render(<SearchGuideTestCase />);

    expect(
        screen.queryByText(/Welcome to Global.health Data!/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText('Open'));

    waitFor(() => {
        expect(
            screen.queryByText(/Welcome to Global.health Data!/i),
        ).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('close-search-guide-button'));

    expect(
        screen.queryByText(/Welcome to Global.health Data!/i),
    ).not.toBeInTheDocument();
});

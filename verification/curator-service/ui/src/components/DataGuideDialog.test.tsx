import React from 'react';
import { screen, fireEvent, render, waitFor } from './util/test-utils';
import { Button } from '@material-ui/core';
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
    render(<SearchGuideTestCase />);

    expect(
        screen.queryByText(/Welcome to Global.health Data!/i),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Open'));

    waitFor(() => {
        expect(
            screen.queryByText(/Welcome to Global.health Data!/i),
        ).toBeInTheDocument();
    });
});

it('closes properly after clicking on close button', async () => {
    render(<SearchGuideTestCase defaultOpen={true} />);

    expect(
        await screen.findByText(/Welcome to Global.health Data!/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-search-guide-button'));

    waitFor(() => {
        expect(
            screen.queryByText(/Welcome to Global.health Data!/i),
        ).not.toBeInTheDocument();
    });
});

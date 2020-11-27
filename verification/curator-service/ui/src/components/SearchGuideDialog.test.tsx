import React from 'react';
import { fireEvent, render, wait } from '@testing-library/react';
import { Button } from '@material-ui/core';
import SearchGuideDialog from './SearchGuideDialog';

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
            <SearchGuideDialog
                isOpen={isOpen}
                onToggle={toggleDialog}
                rootComponentRef={rootRef}
                triggerComponentRef={buttonRef}
            />
        </div>
    );
};

it('opens properly after clicking on button', async () => {
    const { getByText, queryByText } = render(<SearchGuideTestCase />);

    expect(queryByText('Search syntax')).not.toBeInTheDocument();

    fireEvent.click(getByText('Open'));

    wait(() => {
        expect(queryByText('Search syntax')).toBeInTheDocument();
    });
});

it('closes properly after clicking on close button', async () => {
    const { getByTestId, findByText, queryByText } = render(
        <SearchGuideTestCase defaultOpen={true} />,
    );

    expect(await findByText('Search syntax')).toBeInTheDocument();

    fireEvent.click(getByTestId('close-search-guide-button'));

    wait(() => {
        expect(queryByText('Search syntax')).not.toBeInTheDocument();
    });
});

import React from 'react';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core';
import Draggable from 'react-draggable';

type Props = WithStyles<typeof styles> & {
    isOpen: boolean;
    onClose: () => void;
};

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            cursor: 'move',
            position: 'absolute',
            zIndex: 1500,
            padding: theme.spacing(2),
        },
    });

const SearchGuideDialog = ({
    isOpen,
    onClose,
    classes,
}: Props): JSX.Element | null => {
    if (!isOpen) return null;

    return (
        <Draggable handle="#draggable-search-guide" bounds="body">
            <div className={classes.root} id="draggable-search-guide">
                <p>Search syntax</p>
            </div>
        </Draggable>
    );
};

export default withStyles(styles, { withTheme: true })(SearchGuideDialog);

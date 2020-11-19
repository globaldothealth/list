import React from 'react';
import {
    Box,
    Button,
    createStyles,
    Theme,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Draggable from 'react-draggable';

type Props = WithStyles<typeof styles>;

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
        closeIcon: {
            cursor: 'pointer',
        },
    });

const SearchGuideDialog = ({ classes }: Props): JSX.Element | null => {
    return (
        <Draggable handle="#draggable-search-guide" bounds="body">
            <Box className={classes.root} id="draggable-search-guide">
                <Box position="relative">
                    <Box position="absolute" top={0} right={0}>
                        <CloseIcon className={classes.closeIcon} />
                    </Box>
                    <Typography>Search syntax</Typography>
                    <Typography>Lorem ipsum dolor sit amet</Typography>
                </Box>
            </Box>
        </Draggable>
    );
};

export default withStyles(styles, { withTheme: true })(SearchGuideDialog);

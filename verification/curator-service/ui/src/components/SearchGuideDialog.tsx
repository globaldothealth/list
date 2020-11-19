import React, { useEffect } from 'react';
import {
    Box,
    createStyles,
    Theme,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Draggable, { ControlPosition } from 'react-draggable';

type Props = WithStyles<typeof styles> & {
    triggerRef: React.RefObject<HTMLDivElement>;
    onToggle: () => void;
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
        closeIcon: {
            cursor: 'pointer',
        },
    });

const SearchGuideDialog = ({
    triggerRef,
    onToggle,
    classes,
}: Props): JSX.Element | null => {
    const [
        positionOffset,
        setPositionOffset,
    ] = React.useState<ControlPosition | null>(null);

    useEffect(() => {
        const container = triggerRef.current;
        // additional offset to place dialog just below search guide button
        const leftOffset = 116;

        if (container) {
            setPositionOffset({
                x: container.offsetLeft + leftOffset,
                y: container.offsetTop + container.offsetHeight,
            });
        }
    }, [triggerRef]);

    return (
        positionOffset && (
            <Draggable
                handle="#draggable-search-guide"
                bounds="body"
                defaultPosition={positionOffset}
            >
                <Box className={classes.root} id="draggable-search-guide">
                    <Box position="relative">
                        <Box position="absolute" top={0} right={0}>
                            <CloseIcon
                                className={classes.closeIcon}
                                onClick={onToggle}
                            />
                        </Box>
                        <Typography>Search syntax</Typography>
                        <Typography>Lorem ipsum dolor sit amet</Typography>
                    </Box>
                </Box>
            </Draggable>
        )
    );
};

export default withStyles(styles, { withTheme: true })(SearchGuideDialog);

import React, { useEffect } from 'react';
import {
    Box,
    createStyles,
    Portal,
    Theme,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Draggable, { ControlPosition } from 'react-draggable';

type Props = WithStyles<typeof styles> & {
    rootComponentRef: React.RefObject<HTMLDivElement>;
    triggerComponentRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    onToggle: () => void;
};

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        root: {
            maxWidth: 520,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            cursor: 'move',
            position: 'absolute',
            zIndex: 1500,
            borderRadius: 5,
            padding: theme.spacing(4),
        },
        closeIcon: {
            width: 30,
            height: 30,
            cursor: 'pointer',
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
        },
        subtitle: {
            fontSize: 18,
            fontWeight: 'bold',
        },
        list: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            padding: 0,
            fontSize: 16,

            '& > li': {
                flex: '0 0 33.3333%',
                listStyleType: 'none',
            },
        },
    });

// additional offsets to keep the position ideally below the search guide button
const LEFT_OFFSET = -16;
const TOP_OFFSET = 6;

const SearchGuideDialog = ({
    rootComponentRef,
    triggerComponentRef,
    isOpen,
    onToggle,
    classes,
}: Props): JSX.Element | null => {
    const [
        positionOffset,
        setPositionOffset,
    ] = React.useState<ControlPosition | null>(null);
    const nodeRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = triggerComponentRef.current;

        if (container) {
            const { left, bottom } = container.getBoundingClientRect();
            setPositionOffset({
                x: left + LEFT_OFFSET,
                y: bottom + TOP_OFFSET,
            });
        }
    }, [triggerComponentRef]);

    if (!isOpen || !positionOffset) {
        return null;
    }

    return (
        <Portal container={rootComponentRef.current}>
            <Draggable
                handle="#draggable-search-guide"
                bounds="body"
                defaultPosition={positionOffset}
                nodeRef={nodeRef}
            >
                <div
                    ref={nodeRef}
                    className={classes.root}
                    id="draggable-search-guide"
                >
                    <Box position="relative">
                        <Box position="absolute" top={0} right={0}>
                            <CloseIcon
                                className={classes.closeIcon}
                                onClick={onToggle}
                                data-testid="close-search-guide-button"
                            />
                        </Box>
                        <Box mb={1}>
                            <Typography className={classes.title}>
                                Welcome to Global.health Data!
                            </Typography>
                        </Box>
                        <Typography>
                            You can use the following keywords to search our
                            line-list database by selecting from the filter
                            list, clicking on a column header, or manually
                            entering in the search box using the syntax
                            "keyword: value"
                        </Typography>
                        <ul className={classes.list}>
                            <li>curator</li>
                            <li>gender</li>
                            <li>nationality</li>
                            <li>occupation</li>
                            <li>country</li>
                            <li>outcome</li>
                            <li>caseid</li>
                            <li>sourceurl</li>
                            <li>verificationstatus</li>
                            <li>uploadid</li>
                            <li>admin1</li>
                            <li>admin2</li>
                            <li>admin3</li>
                            <li>variant</li>
                        </ul>
                    </Box>
                </div>
            </Draggable>
        </Portal>
    );
};

export default withStyles(styles, { withTheme: true })(SearchGuideDialog);

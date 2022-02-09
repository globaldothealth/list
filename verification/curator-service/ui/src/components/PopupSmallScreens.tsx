import React, { useEffect, useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import {
    createStyles,
    useTheme,
    useMediaQuery,
    Dialog,
    DialogTitle,
    IconButton,
    DialogContent,
    Theme,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';

type Props = WithStyles<typeof styles> & {
    rootComponentRef: React.RefObject<HTMLDivElement>;
    triggerComponentRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    onToggle: () => void;
};

const styles = (theme: Theme) =>
    createStyles({
        dialogContainer: {
            height: '40%',
        },
        dialogTitle: {
            display: 'flex',
        },
        closeButton: {
            position: 'absolute',
            right: 8,
            top: 8,
        },
    });

const PopupSmallScreens = ({ classes }: Props) => {
    const theme = useTheme();
    const [dialogOpen, setDialogOpen] = useState(false);

    /**
    @name matches - value of the current browser window in pixels
     **/

    const matches = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        setDialogOpen(matches);
    }, [matches]);

    const handleClose = () => {
        setDialogOpen(false);
    };

    return (
        <Dialog
            open={dialogOpen}
            onClose={handleClose}
            className={classes.dialogContainer}
            id="popup-small-screens"
        >
            <DialogTitle className={classes.dialogTitle}>
                Important
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    className={classes.closeButton}
                    id="small-screens-popup-close-btn"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography gutterBottom>
                    For a better experience please visit this website using a
                    device with a bigger screen
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default withStyles(styles, { withTheme: true })(PopupSmallScreens);

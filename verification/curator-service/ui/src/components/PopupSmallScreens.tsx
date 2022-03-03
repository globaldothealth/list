import React, { useEffect, useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import {
    makeStyles,
    useTheme,
    useMediaQuery,
    Dialog,
    DialogTitle,
    IconButton,
    DialogContent,
    Typography,
} from '@material-ui/core';

const useStyles = makeStyles({
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

export default function PopupSmallScreens() {
    const theme = useTheme();
    const classes = useStyles();
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
                    device with a larger screen
                </Typography>
            </DialogContent>
        </Dialog>
    );
}

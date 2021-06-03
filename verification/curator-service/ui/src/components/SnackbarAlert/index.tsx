import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

interface SnackbarAlertProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
    durationMs?: number;
}

const Alert = (props: AlertProps) => {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
};

export const SnackbarAlert: React.FC<SnackbarAlertProps> = ({
    isOpen,
    setIsOpen,
    message,
    type,
    durationMs = 5000,
}) => {
    return (
        <Snackbar
            open={isOpen}
            autoHideDuration={durationMs}
            onClose={() => setIsOpen(false)}
        >
            <Alert severity={type}>{message}</Alert>
        </Snackbar>
    );
};

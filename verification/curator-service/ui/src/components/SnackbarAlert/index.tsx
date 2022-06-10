import React, { ReactNode, forwardRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface SnackbarAlertProps {
    isOpen: boolean | undefined;
    onClose: () => void;
    message: string | ReactNode;
    type: 'success' | 'warning' | 'info' | 'error';
    durationMs?: number;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} variant="filled" ref={ref} {...props} />;
});

export const SnackbarAlert: React.FC<SnackbarAlertProps> = ({
    isOpen,
    onClose,
    message,
    type,
    durationMs = 5000,
}) => {
    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={isOpen}
            autoHideDuration={durationMs}
            onClose={onClose}
        >
            <Alert severity={type}>{message}</Alert>
        </Snackbar>
    );
};

import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
    selectResetPasswordEmailSent,
    selectForgotPasswordPopupOpen,
    selectIsLoading,
    selectError,
} from '../../redux/auth/selectors';
import { requestResetPasswordLink } from '../../redux/auth/thunk';
import {
    setForgotPasswordPopupOpen,
    resetError,
    toggleSnackbar,
} from '../../redux/auth/slice';

import { makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
    checkboxRoot: {
        display: 'block',
    },
    required: {
        color: theme.palette.error.main,
    },
    inpputField: {
        display: 'block',
        width: '240px',
        marginBottom: '10px',
    },
    signInButton: {
        marginTop: '10px',
        marginBottom: '10px',
    },
    link: {
        fontWeight: 'bold',
        color: theme.palette.primary.main,
        cursor: 'pointer',
    },
    title: {
        margin: '10px 0',
    },
    formFlexContainer: {
        display: 'flex',
        gap: '80px',
    },
}));

interface FormValues {
    email: string;
}

export default function ForgotPasswordForm(): React.ReactElement {
    const classes = useStyles();
    const dispatch = useAppDispatch();

    const resetPasswordEmailSent = useAppSelector(selectResetPasswordEmailSent);
    const forgotPasswordPopupOpen = useAppSelector(
        selectForgotPasswordPopupOpen,
    );
    const isLoading = useAppSelector(selectIsLoading);
    const error = useAppSelector(selectError);

    // After successfuly sending email show snackbar alert and hide this popup
    useEffect(() => {
        if (!resetPasswordEmailSent) return;

        formik.resetForm();

        dispatch(setForgotPasswordPopupOpen(false));
        dispatch(
            toggleSnackbar({
                isOpen: true,
                message:
                    'Email containing password reset link was sent. Please check your inbox.',
            }),
        );

        // eslint-disable-next-line
    }, [dispatch, resetPasswordEmailSent]);

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('This field is required'),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            email: '',
        },
        validationSchema,
        onSubmit: (values) => {
            dispatch(requestResetPasswordLink(values));
        },
    });

    return (
        <>
            <Dialog
                open={forgotPasswordPopupOpen}
                onClose={() => dispatch(setForgotPasswordPopupOpen(false))}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
            >
                <DialogTitle data-testid="forgot-password-dialog">
                    Forgot your Password?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Don't worry! Just fill in your email address and we'll
                        send you a link to reset your password.
                    </DialogContentText>
                    <form onSubmit={formik.handleSubmit}>
                        <div className={classes.formFlexContainer}>
                            <div className="normalSigninFields">
                                <TextField
                                    disabled={isLoading}
                                    fullWidth
                                    className={classes.inpputField}
                                    variant="outlined"
                                    id="forgotEmailField"
                                    name="email"
                                    label="Email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={
                                        formik.touched.email &&
                                        Boolean(formik.errors.email)
                                    }
                                    helperText={
                                        formik.touched.email &&
                                        formik.errors.email
                                    }
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                            className={classes.signInButton}
                            data-testid="send-reset-link"
                        >
                            Send reset link
                        </Button>

                        {isLoading && <LinearProgress color="primary" />}

                        {error && (
                            <Alert
                                severity="error"
                                onClose={() => dispatch(resetError())}
                            >
                                {error}
                            </Alert>
                        )}
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
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
    },
    link: {
        fontWeight: 'bold',
        color: theme.palette.primary.main,
        cursor: 'pointer',
    },
    forgotPassword: {
        fontWeight: 'normal',
        color: theme.palette.primary.main,
        cursor: 'pointer',
        fontSize: 'small',
        marginTop: '-8px',
        display: 'flex',
        justifyContent: 'flex-end',
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
    password: string;
}

interface SignInFormProps {
    forgotPasswordScreenOn: boolean;
    setForgotPasswordScreenOn: (active: boolean) => void;
}

export default function ChangePasswordForm({
    forgotPasswordScreenOn, setForgotPasswordScreenOn
}: SignInFormProps) {
    const classes = useStyles();

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('This field is required'),
        confirmEmail: Yup.string().test(
            'emails-match',
            'Emails must match',
            function (value) {
                return this.parent.email === value;
            },
        ),
        password: Yup.string().required('This field is required'),
        passwordConfirmation: Yup.string().test(
            'passwords-match',
            'Passwords must match',
            function (value) {
                return this.parent.password === value;
            },
        ),
        isAgreementChecked: Yup.bool().oneOf([true], 'This field is required'),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: (values) => {
            // @TODO: Send reqest to authenticate user using username and password
        },
    });

    return (
        <>
            <Dialog
                open={forgotPasswordScreenOn}
                onClose={(): void => setForgotPasswordScreenOn(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
            >
                <DialogTitle>Forgot your Password?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Don't worry! Just fill in your email address and we'll
                        send you a link to reset your password.
                    </DialogContentText>
                    <form onSubmit={formik.handleSubmit}>
                        <div className={classes.formFlexContainer}>
                            <div className="normalSigninFields">
                                <TextField
                                    fullWidth
                                    className={classes.inpputField}
                                    variant="outlined"
                                    id="email"
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
                            className={classes.signInButton}
                        >
                            Send reset link
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

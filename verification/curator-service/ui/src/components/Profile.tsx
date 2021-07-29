import React, { useState, useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { changePassword } from '../redux/auth/thunk';

import {
    selectUser,
    selectError,
    selectChangePasswordResponse,
    selectIsLoading,
} from '../redux/auth/selectors';
import { resetError, resetChangePasswordResponse } from '../redux/auth/slice';

import { useFormik } from 'formik';
import * as Yup from 'yup';

import { Theme, makeStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Chip, Tooltip } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import { SnackbarAlert } from './SnackbarAlert';

const styles = makeStyles((theme: Theme) => ({
    root: {
        textAlign: 'center',
    },
    login: {
        marginTop: theme.spacing(10),
    },
    name: {
        marginTop: theme.spacing(10),
    },
    email: {
        marginTop: theme.spacing(2),
    },
    role: {
        marginTop: theme.spacing(2),
        marginRight: theme.spacing(1),
    },
}));

const useStyles = makeStyles((theme: Theme) => ({
    inpputField: {
        display: 'block',
        width: '240px',
        marginBottom: '10px',
    },
    signInButton: {
        marginTop: '10px',
        marginBottom: '20px',
    },
    title: {
        margin: '10px 0',
        fontWeight: 700,
    },
    formFlexContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '30px',
    },
    linearProgress: {
        width: '240px',
    },
}));

interface FormValues {
    oldPassword: string;
    password: string;
    passwordConfirmation: string;
}

export function ChangePasswordFormInProfile(): JSX.Element {
    const classes = useStyles();
    const dispatch = useAppDispatch();

    const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
        useState(false);
    const error = useAppSelector(selectError);
    const changePasswordResponse = useAppSelector(selectChangePasswordResponse);
    const isLoading = useAppSelector(selectIsLoading);

    const lowercaseRegex = /(?=.*[a-z])/;
    const uppercaseRegex = /(?=.*[A-Z])/;
    const numericRegex = /(?=.*[0-9])/;

    const validationSchema = Yup.object().shape({
        oldPassword: Yup.string().required('This field is required'),
        password: Yup.string()
            .matches(lowercaseRegex, 'one lowercase required!')
            .matches(uppercaseRegex, 'one uppercase required!')
            .matches(numericRegex, 'one number required!')
            .min(8, 'Minimum 8 characters required!')
            .test(
                'passwords-different',
                "New password can't be the same as old password",
                function (value) {
                    return this.parent.oldPassword !== value;
                },
            )
            .required('Required!'),
        passwordConfirmation: Yup.string().test(
            'passwords-match',
            'Passwords must match',
            function (value) {
                return this.parent.password === value;
            },
        ),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            oldPassword: '',
            password: '',
            passwordConfirmation: '',
        },
        validationSchema,
        onSubmit: (values) => {
            const { oldPassword, password } = values;
            dispatch(changePassword({ oldPassword, newPassword: password }));
        },
    });

    useEffect(() => {
        return () => {
            formik.resetForm();
        };
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (!changePasswordResponse) return;

        formik.resetForm();
        //eslint-disable-next-line
    }, [changePasswordResponse]);

    return (
        <>
            <SnackbarAlert
                isOpen={Boolean(changePasswordResponse)}
                onClose={() => dispatch(resetChangePasswordResponse())}
                type="success"
                message={changePasswordResponse || ''}
            />

            <form
                onSubmit={formik.handleSubmit}
                className={classes.formFlexContainer}
            >
                <Typography className={classes.title}>
                    Change your password
                </Typography>
                <FormControl
                    disabled={isLoading}
                    className={classes.inpputField}
                    variant="outlined"
                    error={
                        formik.touched.oldPassword &&
                        Boolean(formik.errors.oldPassword)
                    }
                >
                    <InputLabel htmlFor="oldPassword">Old Password</InputLabel>
                    <OutlinedInput
                        fullWidth
                        id="oldPassword"
                        type={oldPasswordVisible ? 'text' : 'password'}
                        value={formik.values.oldPassword}
                        onChange={formik.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() =>
                                        setOldPasswordVisible(
                                            !oldPasswordVisible,
                                        )
                                    }
                                    edge="end"
                                >
                                    {passwordVisible ? (
                                        <Visibility />
                                    ) : (
                                        <VisibilityOff />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="Old password"
                    />
                    <FormHelperText>
                        {formik.touched.oldPassword &&
                            formik.errors.oldPassword}
                    </FormHelperText>
                </FormControl>

                <FormControl
                    disabled={isLoading}
                    className={classes.inpputField}
                    variant="outlined"
                    error={
                        formik.touched.password &&
                        Boolean(formik.errors.password)
                    }
                >
                    <InputLabel htmlFor="password">New password</InputLabel>
                    <OutlinedInput
                        fullWidth
                        id="password"
                        name="password"
                        type={passwordVisible ? 'text' : 'password'}
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() =>
                                        setPasswordVisible(!passwordVisible)
                                    }
                                    edge="end"
                                >
                                    {passwordVisible ? (
                                        <Visibility />
                                    ) : (
                                        <VisibilityOff />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="New password"
                    />
                    <FormHelperText>
                        {formik.touched.password && formik.errors.password}
                    </FormHelperText>
                </FormControl>

                <FormControl
                    disabled={isLoading}
                    className={classes.inpputField}
                    variant="outlined"
                    error={
                        formik.touched.passwordConfirmation &&
                        Boolean(formik.errors.passwordConfirmation)
                    }
                >
                    <InputLabel htmlFor="passwordConfirmation">
                        Repeat new password
                    </InputLabel>
                    <OutlinedInput
                        fullWidth
                        id="passwordConfirmation"
                        type={passwordConfirmationVisible ? 'text' : 'password'}
                        value={formik.values.passwordConfirmation}
                        onChange={formik.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() =>
                                        setPasswordConfirmationVisible(
                                            !passwordConfirmationVisible,
                                        )
                                    }
                                    edge="end"
                                >
                                    {passwordConfirmationVisible ? (
                                        <Visibility />
                                    ) : (
                                        <VisibilityOff />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        }
                        label="Repeat new password"
                    />
                    <FormHelperText>
                        {formik.touched.passwordConfirmation &&
                            formik.errors.passwordConfirmation}
                    </FormHelperText>
                </FormControl>

                <Button
                    disabled={isLoading}
                    type="submit"
                    variant="contained"
                    color="primary"
                    data-testid="change-password-button"
                    className={classes.signInButton}
                >
                    Change password
                </Button>

                {isLoading && (
                    <LinearProgress
                        color="primary"
                        className={classes.linearProgress}
                    />
                )}

                {error && (
                    <Alert
                        severity="error"
                        onClose={() => dispatch(resetError())}
                    >
                        {error}
                    </Alert>
                )}
            </form>
        </>
    );
}

export default function Profile(): JSX.Element {
    const classes = styles();

    const user = useAppSelector(selectUser);

    return (
        <>
            {user ? (
                <div className={classes.root}>
                    {!user.email && (
                        <div className={classes.login}>
                            Login required to view this page
                        </div>
                    )}

                    {user.name && (
                        <div className={classes.name}>
                            <strong>Name:</strong> {user.name}
                        </div>
                    )}

                    {user.email && (
                        <div className={classes.email}>
                            <strong>Email: </strong>
                            {user.email}
                        </div>
                    )}

                    {user.roles &&
                        user.roles.map((role) => {
                            const tooltip = (
                                text: string,
                                role: string,
                            ): JSX.Element => {
                                return (
                                    <Tooltip
                                        className={classes.role}
                                        key={role}
                                        title={text}
                                    >
                                        <Chip variant="outlined" label={role} />
                                    </Tooltip>
                                );
                            };
                            switch (role) {
                                case 'curator':
                                    return tooltip(
                                        'curators can submit and verify cases and ingestion sources',
                                        role,
                                    );
                                case 'admin':
                                    return tooltip(
                                        'admins can administer roles of other users',
                                        role,
                                    );
                                default:
                                    throw Error(`Unknown role ${role}`);
                            }
                        })}
                    {!user.googleID && <ChangePasswordFormInProfile />}
                </div>
            ) : (
                <></>
            )}
        </>
    );
}

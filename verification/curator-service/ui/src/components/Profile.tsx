import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectPasswordReset } from '../redux/auth/selectors';
import { toggleSnackbar } from '../redux/auth/slice';
import { resetPassword } from '../redux/auth/thunk';

import { selectUser } from '../redux/auth/selectors';
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
    checkboxLabel: {
        fontSize: '14px',
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
    labelRequired: {
        color: theme.palette.error.main,
    },
    title: {
        margin: '10px 0',
        fontWeight: 700,
    },
    googleButton: {
        // margin: '35px 0 0 0',
        fontWeight: 400,
    },
    formFlexContainer: {
        display: 'flex',
        gap: '80px',
        justifyContent: 'center',
        marginTop: '30px',
    },
}));

interface FormValues {
    oldpassword: string;
    password: string;
    passwordConfirmation: string;
}

interface ChangePasswordFormInProfileProps {
    disabled?: boolean;
}

export function ChangePasswordFormInProfile({
    disabled,
}: ChangePasswordFormInProfileProps): JSX.Element {
    const classes = useStyles();
    const dispatch = useAppDispatch();
    const history = useHistory();

    const passwordReset = useAppSelector(selectPasswordReset);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [
        passwordConfirmationVisible,
        setPasswordConfirmationVisible,
    ] = useState(false);

    // After successful password reset redirect user to landing page and show snackbar alert
    useEffect(() => {
        if (!passwordReset) return;

        history.push('/');
        dispatch(
            toggleSnackbar({
                isOpen: true,
                message:
                    'Your password was changed successfully. You can now sign in using the new password',
            }),
        );
    }, [dispatch, history, passwordReset]);

    const lowercaseRegex = /(?=.*[a-z])/;
    const uppercaseRegex = /(?=.*[A-Z])/;
    const numericRegex = /(?=.*[0-9])/;

    const validationSchema = Yup.object().shape({
        oldpassword: Yup.string().required('This field is required'),
        password: Yup.string()
            .matches(lowercaseRegex, 'one lowercase required!')
            .matches(uppercaseRegex, 'one uppercase required!')
            .matches(numericRegex, 'one number required!')
            .min(8, 'Minimum 8 characters required!')
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
            oldpassword: '',
            password: '',
            passwordConfirmation: '',
        },
        validationSchema,
        onSubmit: (values) => {
            console.log(values);
            // dispatch(
            //     resetPassword({
            //         newPassword: values.password,
            //     }),
            // );
        },
    });

    useEffect(() => {
        return () => {
            formik.resetForm();
        };
        // eslint-disable-next-line
    }, []);

    return (
        <>
            <form onSubmit={formik.handleSubmit}>
                <div className={classes.formFlexContainer}>
                    <div id="rightBox">
                        <Typography className={classes.title}>
                            Change your password
                        </Typography>
                        <FormControl
                            disabled={disabled}
                            className={classes.inpputField}
                            variant="outlined"
                            error={
                                formik.touched.oldpassword &&
                                Boolean(formik.errors.oldpassword)
                            }
                        >
                            <InputLabel htmlFor="oldpassword">
                                Old Password
                            </InputLabel>
                            <OutlinedInput
                                fullWidth
                                id="oldpassword"
                                type={passwordVisible ? 'text' : 'password'}
                                value={formik.values.oldpassword}
                                onChange={formik.handleChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() =>
                                                setPasswordVisible(
                                                    !passwordVisible,
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
                                {formik.touched.oldpassword &&
                                    formik.errors.oldpassword}
                            </FormHelperText>
                        </FormControl>

                        <FormControl
                            disabled={disabled}
                            className={classes.inpputField}
                            variant="outlined"
                            error={
                                formik.touched.password &&
                                Boolean(formik.errors.password)
                            }
                        >
                            <InputLabel htmlFor="password">Password</InputLabel>
                            <OutlinedInput
                                fullWidth
                                id="password"
                                type={passwordVisible ? 'text' : 'password'}
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() =>
                                                setPasswordVisible(
                                                    !passwordVisible,
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
                                label="New password"
                            />
                            <FormHelperText>
                                {formik.touched.password &&
                                    formik.errors.password}
                            </FormHelperText>
                        </FormControl>

                        <FormControl
                            disabled={disabled}
                            className={classes.inpputField}
                            variant="outlined"
                            error={
                                formik.touched.passwordConfirmation &&
                                Boolean(formik.errors.passwordConfirmation)
                            }
                        >
                            <InputLabel htmlFor="passwordConfirmation">
                                Repeat password
                            </InputLabel>
                            <OutlinedInput
                                fullWidth
                                id="passwordConfirmation"
                                type={
                                    passwordConfirmationVisible
                                        ? 'text'
                                        : 'password'
                                }
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
                    </div>
                </div>

                <Button
                    disabled={disabled}
                    type="submit"
                    variant="contained"
                    color="primary"
                    data-testid="change-password-button"
                    className={classes.signInButton}
                >
                    Change password
                </Button>
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
                    <ChangePasswordFormInProfile />
                </div>
            ) : (
                <></>
            )}
        </>
    );
}

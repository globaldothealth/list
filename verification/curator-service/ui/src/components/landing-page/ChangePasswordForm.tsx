import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { makeStyles, Theme } from '@material-ui/core/styles';
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
    },
    googleButton: {
        // margin: '35px 0 0 0',
        fontWeight: 400,
    },
    formFlexContainer: {
        display: 'flex',
        gap: '80px',
    },
}));

interface FormValues {
    password: string;
    passwordConfirmation: string;
}

export default function ChangePasswordForm(): JSX.Element {
    const classes = useStyles();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
        useState(false);

    const validationSchema = Yup.object().shape({
        password: Yup.string().required('This field is required'),
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
            password: '',
            passwordConfirmation: '',
        },
        validationSchema,
        onSubmit: (values) => {
            // @TODO: Send reqest to authenticate user using username and password
            console.log(values);
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
                            Choose a new password{' '}
                        </Typography>
                        <FormControl
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
                                label="Password"
                            />
                            <FormHelperText>
                                {formik.touched.password &&
                                    formik.errors.password}
                            </FormHelperText>
                        </FormControl>

                        <FormControl
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
                                label="Repeat password"
                            />
                            <FormHelperText>
                                {formik.touched.passwordConfirmation &&
                                    formik.errors.passwordConfirmation}
                            </FormHelperText>
                        </FormControl>
                    </div>
                </div>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.signInButton}
                >
                    Change password
                </Button>
            </form>
        </>
    );
}

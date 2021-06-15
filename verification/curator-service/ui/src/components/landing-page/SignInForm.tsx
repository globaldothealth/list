import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { makeStyles, Theme } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import GoogleButton from 'react-google-button';
import {    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle} from '@material-ui/core';

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
    email: string;
    confirmEmail: string;
    password: string;
    passwordConfirmation: string;
    isAgreementChecked: boolean;
    isNewsletterChecked: boolean;
}

export default function SignInForm() {
    const classes = useStyles();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [registrationScreenOn, setRgistrationScrenOn] = useState(false);
    const [forgotPasswordScreenOn, setForgotPasswordScreenOn] = useState(false);

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
            confirmEmail: '',
            password: '',
            passwordConfirmation: '',
            isAgreementChecked: false,
            isNewsletterChecked: false,
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
    }, [registrationScreenOn]);

    return (
        <>
            {!registrationScreenOn && (
                <form onSubmit={formik.handleSubmit}>
                    <div className={classes.formFlexContainer}>
                        <div className="normalSigninFields">
                            <Typography className={classes.title}>
                                Sign in with username and password
                            </Typography>
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
                                    formik.touched.email && formik.errors.email
                                }
                            />
                            <FormControl
                                className={classes.inpputField}
                                variant="outlined"
                                error={
                                    formik.touched.password &&
                                    Boolean(formik.errors.password)
                                }
                            >
                                <InputLabel htmlFor="password">
                                    Password
                                </InputLabel>
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
                                <Typography className={classes.title}>
                                    <span
                                        className={classes.forgotPassword}
                                        onClick={() =>
                                            setForgotPasswordScreenOn(true)
                                        }
                                    >
                                        {' '}
                                        Forgot your password?
                                    </span>
                                </Typography>
                            </FormControl>
                        </div>

                        <div>
                            <Typography className={classes.title}>
                                Or sign in with Google
                            </Typography>
                            <GoogleButton className={classes.googleButton} />
                        </div>
                    </div>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.isAgreementChecked}
                                    onChange={formik.handleChange}
                                    name="isAgreementChecked"
                                    id="isAgreementChecked"
                                />
                            }
                            label={
                                <Typography className={classes.checkboxLabel}>
                                    By creating an account, I accept the
                                    Global.health{' '}
                                    <a
                                        href="https://global.health/terms-of-use/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href="https://global.health/privacy/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        Privacy Policy
                                    </a>{' '}
                                    <span className={classes.labelRequired}>
                                        *
                                    </span>
                                </Typography>
                            }
                        />
                        {formik.touched.isAgreementChecked &&
                            formik.errors.isAgreementChecked && (
                                <FormHelperText error variant="outlined">
                                    {formik.errors.isAgreementChecked}
                                </FormHelperText>
                            )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.isNewsletterChecked}
                                    onChange={formik.handleChange}
                                    name="isNewsletterChecked"
                                    id="isNewsletterChecked"
                                />
                            }
                            label={
                                <Typography className={classes.checkboxLabel}>
                                    I agree to be added to the Global.health
                                    newsletter
                                </Typography>
                            }
                        />
                    </FormGroup>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.signInButton}
                    >
                        Sign in
                    </Button>

                    <Typography className={classes.title}>
                        Don't have an account?{' '}
                        <span
                            className={classes.link}
                            onClick={() => setRgistrationScrenOn(true)}
                        >
                            {' '}
                            Sign up!
                        </span>
                    </Typography>
                </form>
            )}

            {registrationScreenOn && (
                <form onSubmit={formik.handleSubmit}>
                    <div className={classes.formFlexContainer}>
                        <div id="leftBox">
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
                                    formik.touched.email && formik.errors.email
                                }
                            />

                            <TextField
                                fullWidth
                                className={classes.inpputField}
                                variant="outlined"
                                id="confirmEmail"
                                name="confirmEmail"
                                label="Confirm Email"
                                value={formik.values.confirmEmail}
                                onChange={formik.handleChange}
                                error={
                                    formik.touched.confirmEmail &&
                                    Boolean(formik.errors.confirmEmail)
                                }
                                helperText={
                                    formik.touched.confirmEmail &&
                                    formik.errors.confirmEmail
                                }
                            />
                        </div>

                        <div id="rightBox">
                            <FormControl
                                className={classes.inpputField}
                                variant="outlined"
                                error={
                                    formik.touched.password &&
                                    Boolean(formik.errors.password)
                                }
                            >
                                <InputLabel htmlFor="password">
                                    Password
                                </InputLabel>
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
                                    formik.touched.password &&
                                    Boolean(formik.errors.password)
                                }
                            >
                                <InputLabel htmlFor="passwordConfirmation">
                                    Repeat password
                                </InputLabel>
                                <OutlinedInput
                                    fullWidth
                                    id="passwordConfirmation"
                                    type={passwordVisible ? 'text' : 'password'}
                                    value={formik.values.passwordConfirmation}
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
                                    label="Repeat password"
                                />
                                <FormHelperText>
                                    {formik.touched.passwordConfirmation &&
                                        formik.errors.passwordConfirmation}
                                </FormHelperText>
                            </FormControl>
                        </div>
                    </div>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.isAgreementChecked}
                                    onChange={formik.handleChange}
                                    name="isAgreementChecked"
                                    id="isAgreementChecked"
                                />
                            }
                            label={
                                <Typography className={classes.checkboxLabel}>
                                    By creating an account, I accept the
                                    Global.health{' '}
                                    <a
                                        href="https://global.health/terms-of-use/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href="https://global.health/privacy/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        Privacy Policy
                                    </a>{' '}
                                    <span className={classes.labelRequired}>
                                        *
                                    </span>
                                </Typography>
                            }
                        />
                        {formik.touched.isAgreementChecked &&
                            formik.errors.isAgreementChecked && (
                                <FormHelperText error variant="outlined">
                                    {formik.errors.isAgreementChecked}
                                </FormHelperText>
                            )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.isNewsletterChecked}
                                    onChange={formik.handleChange}
                                    name="isNewsletterChecked"
                                    id="isNewsletterChecked"
                                />
                            }
                            label={
                                <Typography className={classes.checkboxLabel}>
                                    I agree to be added to the Global.health
                                    newsletter
                                </Typography>
                            }
                        />
                    </FormGroup>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.signInButton}
                    >
                        Sign up
                    </Button>

                    <Typography className={classes.title}>
                        Do you have already an account?{' '}
                        <span
                            className={classes.link}
                            onClick={() => setRgistrationScrenOn(false)}
                        >
                            {' '}
                            Sign in!
                        </span>
                    </Typography>
                </form>
            )}

            {/* {forgotPasswordScreenOn &&  
            <form onSubmit={formik.handleSubmit}>
                    <div className={classes.formFlexContainer}>
                        <div className="normalSigninFields">
                            <Typography className={classes.title}>
                                Forgot your Password?
                            </Typography>
                            <Typography className={classes.title}>
                                Don't worry! Just fill in your email address and we'll send you a link to reset your password.
                            </Typography>
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
                                    formik.touched.email && formik.errors.email
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
                        Reset password
                    </Button>

                    <Typography className={classes.title}>
                        Do you remember the password?{' '}
                        <span
                            className={classes.link}
                            onClick={() => setForgotPasswordScreenOn(false)}
                        >
                            {' '}
                            Sign in!
                        </span>
                    </Typography>
                </form>} */}


                <Dialog
                open={forgotPasswordScreenOn}
                onClose={(): void => setForgotPasswordScreenOn(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
            >
                <DialogTitle>
                Forgot your Password?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                    Don't worry! Just fill in your email address and we'll send you a link to reset your password.
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
                                    formik.touched.email && formik.errors.email
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

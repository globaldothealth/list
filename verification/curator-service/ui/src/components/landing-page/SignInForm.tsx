import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch } from '../../hooks/redux';
import { signInWithEmailAndPassword } from '../../redux/auth/thunk';
import { setForgotPasswordPopupOpen } from '../../redux/auth/slice';

import { makeStyles, Theme } from '@material-ui/core/styles';
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
import Typography from '@material-ui/core/Typography';
import GoogleButton from 'react-google-button';
import ForgotPasswordForm from './ForgotPasswordForm';
import ReCAPTCHA from 'react-google-recaptcha';

const useStyles = makeStyles((theme: Theme) => ({
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
    googleButton: {
        // margin: '35px 0 0 0',
        fontWeight: 400,
    },
    formFlexContainer: {
        display: 'flex',
        gap: '80px',
        flexWrap: 'wrap',
    },
}));

interface FormValues {
    email: string;
    password: string;
}

interface SignInFormProps {
    disabled?: boolean;
    setRegistrationScreenOn: (active: boolean) => void;
}

const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY as string;

export default function SignInForm({
    disabled,
    setRegistrationScreenOn,
}: SignInFormProps): JSX.Element {
    const dispatch = useAppDispatch();
    const classes = useStyles();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('This field is required'),
        password: Yup.string().required('This field is required'),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!recaptchaRef.current) return;

            // eslint-disable-next-line no-useless-catch
            try {
                const token =
                    (await recaptchaRef.current.executeAsync()) as string;
                recaptchaRef.current.reset();
                dispatch(
                    signInWithEmailAndPassword({
                        email: values.email,
                        password: values.password,
                        token,
                    }),
                );
            } catch (error) {
                throw error;
            }
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
                    <div className="normalSigninFields">
                        <Typography className={classes.title}>
                            Sign in with username and password
                        </Typography>
                        <TextField
                            disabled={disabled}
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
                            data-testid="email-textbox"
                        />
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
                                label="Password"
                                data-testid="password-textbox"
                            />
                            <FormHelperText>
                                {formik.touched.password &&
                                    formik.errors.password}
                            </FormHelperText>
                            <Typography className={classes.title}>
                                <span
                                    className={classes.forgotPassword}
                                    data-testid="forgot-password-link"
                                    onClick={() =>
                                        dispatch(
                                            setForgotPasswordPopupOpen(true),
                                        )
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
                        <GoogleButton
                            className={classes.googleButton}
                            disabled={disabled}
                            onClick={() => {
                                window.location.href = `${
                                    process.env.REACT_APP_LOGIN_URL ?? ''
                                }`;
                            }}
                        />
                    </div>
                </div>
                <Button
                    disabled={disabled}
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.signInButton}
                    data-testid="sign-in-button"
                >
                    Sign in
                </Button>

                <Typography className={classes.title}>
                    Don't have an account?{' '}
                    <span
                        className={classes.link}
                        onClick={() => setRegistrationScreenOn(true)}
                    >
                        {' '}
                        Sign up!
                    </span>
                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        size="invisible"
                        ref={recaptchaRef}
                    />
                </Typography>
            </form>

            <ForgotPasswordForm />
        </>
    );
}

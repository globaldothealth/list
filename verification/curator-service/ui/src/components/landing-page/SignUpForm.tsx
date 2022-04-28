import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch } from '../../hooks/redux';
import { signUpWithEmailAndPassword } from '../../redux/auth/thunk';

import { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import GoogleButton from 'react-google-button';

const useStyles = makeStyles((theme: Theme) => ({
    checkboxRoot: {
        display: 'block',
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
    title: {
        margin: '10px 0',
    },
    googleButton: {
        fontWeight: 400,
    },
    googleButtonContainer: {
        marginBottom: '50px',
    },
    formFlexContainer: {
        display: 'flex',
        columnGap: '79px',
        marginTop: '20px',
        flexWrap: 'wrap',
    },
    passwordBlockContainer: {
        [theme.breakpoints.down('sm')]: {
            marginTop: '30px',
        },
    },
    requiredText: {
        fontSize: '14px',
        margin: '10px 0',
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

interface SignUpFormProps {
    disabled: boolean;
    setRegistrationScreenOn: (active: boolean) => void;
}

export default function SignUpForm({
    disabled,
    setRegistrationScreenOn,
}: SignUpFormProps): React.ReactElement {
    const classes = useStyles();
    const dispatch = useAppDispatch();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
        useState(false);

    const lowercaseRegex = /(?=.*[a-z])/;
    const uppercaseRegex = /(?=.*[A-Z])/;
    const numericRegex = /(?=.*[0-9])/;

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('This field is required'),
        confirmEmail: Yup.string().test(
            'emails-match',
            'Emails must match',
            function (value) {
                if (value) {
                    return (
                        this.parent.email.toLowerCase() === value.toLowerCase()
                    );
                } else {
                    return false;
                }
            },
        ),
        password: Yup.string()
            .matches(lowercaseRegex, 'One lowercase required')
            .matches(uppercaseRegex, 'One uppercase required')
            .matches(numericRegex, 'One number required')
            .min(8, 'Minimum 8 characters required')
            .required('This field is required'),
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
            const { email, password, isNewsletterChecked } = values;
            dispatch(
                signUpWithEmailAndPassword({
                    email,
                    password,
                    newsletterAccepted: isNewsletterChecked,
                }),
            );
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
                <Typography variant="h5">Sign up form</Typography>
                <div className={classes.formFlexContainer}>
                    <div>
                        <TextField
                            disabled={disabled}
                            fullWidth
                            className={classes.inpputField}
                            variant="outlined"
                            id="email"
                            name="email"
                            label="Email *"
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
                            disabled={disabled}
                            fullWidth
                            className={classes.inpputField}
                            variant="outlined"
                            id="confirmEmail"
                            name="confirmEmail"
                            label="Confirm Email *"
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

                    <div className={classes.passwordBlockContainer}>
                        <FormControl
                            disabled={disabled}
                            className={classes.inpputField}
                            variant="outlined"
                            error={
                                formik.touched.password &&
                                Boolean(formik.errors.password)
                            }
                        >
                            <InputLabel htmlFor="password">
                                Password *
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
                                            size="large"
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
                            disabled={disabled}
                            className={classes.inpputField}
                            variant="outlined"
                            error={
                                formik.touched.passwordConfirmation &&
                                Boolean(formik.errors.passwordConfirmation)
                            }
                        >
                            <InputLabel htmlFor="passwordConfirmation">
                                Repeat password *
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
                                            size="large"
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

                    <div className={classes.googleButtonContainer}>
                        <div>
                            <Typography className={classes.title}>
                                Or sign up with Google
                            </Typography>
                            <GoogleButton
                                className={classes.googleButton}
                                disabled={disabled}
                                onClick={() => {
                                    if (!formik.values.isAgreementChecked) {
                                        formik.setFieldError(
                                            'isAgreementChecked',
                                            'This field is required',
                                        );
                                        formik.setFieldTouched(
                                            'isAgreementChecked',
                                        );
                                    } else {
                                        window.location.href = `${
                                            process.env.REACT_APP_LOGIN_URL ??
                                            ''
                                        }?newsletterAccepted=${
                                            formik.values.isNewsletterChecked
                                        }`;
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <FormGroup>
                    <FormControlLabel
                        disabled={disabled}
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
                                *
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
                        disabled={disabled}
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
                <Typography className={classes.requiredText}>
                    * Required fields
                </Typography>
                <Button
                    disabled={disabled}
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.signInButton}
                    data-testid="sign-up-button"
                >
                    Sign up
                </Button>

                <Typography className={classes.title}>
                    Already have an account?{' '}
                    <span
                        className={classes.link}
                        onClick={() => setRegistrationScreenOn(false)}
                    >
                        {' '}
                        Sign in!
                    </span>
                </Typography>
            </form>
        </>
    );
}

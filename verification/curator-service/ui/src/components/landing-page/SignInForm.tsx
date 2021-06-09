import React, { useState } from 'react';
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
    },
    labelRequired: {
        color: theme.palette.error.main,
    },
    title: {
        margin: '10px 0',
    },
}));

interface FormValues {
    email: string;
    password: string;
    isAgreementChecked: boolean;
    isNewsletterChecked: boolean;
}

export default function SignInForm() {
    const classes = useStyles();

    const [passwordVisible, setPasswordVisible] = useState(false);

    const validationSchema = Yup.object().shape({
        email: Yup.string()
            .email('Invalid email address')
            .required('This field is required'),
        password: Yup.string().required('This field is required'),
        isAgreementChecked: Yup.bool().oneOf([true], 'This field is required'),
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            email: '',
            password: '',
            isAgreementChecked: false,
            isNewsletterChecked: false,
        },
        validationSchema,
        onSubmit: (values) => {
            // @TODO: Send reqest to authenticate user using username and password
            console.log(values);
        },
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <Typography className={classes.title}>
                Or sign in with username and password
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
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
            />

            <FormControl
                className={classes.inpputField}
                variant="outlined"
                error={
                    formik.touched.password && Boolean(formik.errors.password)
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
                    label="Password"
                />
                <FormHelperText>
                    {formik.touched.password && formik.errors.password}
                </FormHelperText>
            </FormControl>

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
                            By creating an account, I accept the Global.health{' '}
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
                            <span className={classes.labelRequired}>*</span>
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
                            I agree to be added to the Global.health newsletter
                        </Typography>
                    }
                />
            </FormGroup>

            <Typography className={classes.title}>
                Don't have an account?{' '}
                <span className={classes.link}> Sign up!</span>
            </Typography>

            <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.signInButton}
            >
                Sign in
            </Button>
        </form>
    );
}

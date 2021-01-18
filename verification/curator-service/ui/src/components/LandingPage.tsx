import React, { useState } from 'react';
import { ReactComponent as HealthmapInsignias } from './assets/healthmap_insignias.svg';
import { Link } from 'react-router-dom';
import {
    Paper,
    Typography,
    FormHelperText,
    Button,
    LinearProgress,
} from '@material-ui/core';
import { Formik, Form, Field } from 'formik';
import { TextField, CheckboxWithLabel } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core/styles';
import GoogleButton from 'react-google-button';

import PolicyLink from './PolicyLink';

const useStyles = makeStyles(() => ({
    paper: {
        height: 'auto',
        left: '50%',
        maxWidth: '100%',
        padding: '45px',
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '840px',
    },
    body: {
        display: 'flex',
        marginTop: '20px',
    },
    description: {
        color: '#838D89',
        marginRight: '90px',
        width: '60%',
    },
    link: {
        display: 'block',
        margin: '4px 0',
    },
    googleButton: {
        margin: '35px 0 0 0',
        fontWeight: 400,
    },
    registerLengend: {
        color: '#838D89',
    },
    emailField: {
        display: 'block',
        width: '240px',
        marginBottom: '15px',
    },
    signInButton: {
        margin: '15px 0',
    },
    anotherOptionText: {
        margin: '15px 0',
    },
    loader: {
        marginTop: '15px',
    },
}));

interface FormValues {
    email: string;
    isAgreementChecked: boolean;
}

export default function LandingPage(): JSX.Element {
    const [isAgreementChecked, setIsAgreementChecked] = useState<boolean>(
        false,
    );
    const [isAgreementMessage, setIsAgreementMessage] = useState<boolean>(
        false,
    );
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const classes = useStyles();

    const handleSignIn = (
        values: FormValues,
        setSubmitting: (value: boolean) => void,
    ) => {
        setIsSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setIsSubmitting(false);
            alert(JSON.stringify(values, null, 2));
        }, 500);
    };

    return (
        <Paper classes={{ root: classes.paper }}>
            <Typography variant="h4">
                Detailed line list data to power your research
            </Typography>
            <div className={classes.body}>
                <Typography
                    classes={{ root: classes.description }}
                    variant="h5"
                >
                    Welcome to G.h Data. The first of its kind, easy to use
                    global data repository with open access to real-time
                    epidemiological anonymized line list data.
                </Typography>
                <div>
                    <Typography>More information</Typography>
                    <div className={classes.link}>
                        {/* TODO: add in once link is available
                        <a
                            href=""
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Global.health website
                        </a> */}
                    </div>
                    <div className={classes.link}>
                        <a
                            href="http://covid-19.global.health/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Global.health map
                        </a>
                    </div>
                    <div className={classes.link}>
                        <a
                            href="https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/case_fields.yaml"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Data dictionary
                        </a>
                    </div>
                    <div className={classes.link}>
                        <Link to="/terms">Terms of use</Link>
                    </div>
                    <PolicyLink
                        type="privacy-policy"
                        classes={{
                            root: classes.link,
                        }}
                    >
                        Privacy policy
                    </PolicyLink>
                    <PolicyLink
                        type="cookie-policy"
                        classes={{
                            root: classes.link,
                        }}
                    >
                        Cookie policy
                    </PolicyLink>
                </div>
            </div>

            <GoogleButton
                className={classes.googleButton}
                disabled={isSubmitting}
                onClick={() => {
                    if (!isAgreementChecked) {
                        setIsAgreementMessage(true);
                    } else {
                        window.location.href = process.env.REACT_APP_LOGIN_URL!;
                    }
                }}
            />

            <Typography className={classes.anotherOptionText}>
                Or sign in with email
            </Typography>

            <Formik
                initialValues={{ email: '', isAgreementChecked: false }}
                validate={(values) => {
                    const errors: Partial<FormValues> = {};
                    if (!values.email) {
                        errors.email = 'Required';
                    } else if (
                        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(
                            values.email,
                        )
                    ) {
                        errors.email = 'Invalid email address';
                    }
                    if (!values.isAgreementChecked) {
                        errors.isAgreementChecked = true;
                    }

                    return errors;
                }}
                onSubmit={(values, { setSubmitting }) =>
                    handleSignIn(values, setSubmitting)
                }
            >
                {({ errors, touched, submitForm, isSubmitting }) => (
                    <Form>
                        <Field
                            className={classes.emailField}
                            variant="outlined"
                            fullWidth={true}
                            component={TextField}
                            name="email"
                            type="email"
                            label="Email"
                        />
                        <Field
                            component={CheckboxWithLabel}
                            type="checkbox"
                            name="isAgreementChecked"
                            onClick={() => {
                                setIsAgreementChecked(!isAgreementChecked);
                                setIsAgreementMessage(isAgreementChecked);
                            }}
                            Label={{
                                label: (
                                    <small>
                                        By creating an account, I accept the
                                        Global.health TOS and Privacy Policy,
                                        and agree to be added to the newsletter
                                    </small>
                                ),
                            }}
                        />
                        {(isAgreementMessage ||
                            (errors.isAgreementChecked &&
                                touched.isAgreementChecked)) && (
                            <FormHelperText error>
                                This agreement is required
                            </FormHelperText>
                        )}
                        {isSubmitting && (
                            <LinearProgress className={classes.loader} />
                        )}
                        <Button
                            className={classes.signInButton}
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
                            onClick={submitForm}
                        >
                            Sign in
                        </Button>
                    </Form>
                )}
            </Formik>
            <HealthmapInsignias />
        </Paper>
    );
}

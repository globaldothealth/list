import React, { useState, useEffect } from 'react';
import { ReactComponent as HealthmapInsignias } from '../assets/healthmap_insignias.svg';
import { Link } from 'react-router-dom';
import {
    Paper,
    Typography,
    FormHelperText,
    Button,
    LinearProgress,
} from '@material-ui/core';
//TODO: Add Dialog
import { Formik, Form, Field } from 'formik';
import { TextField, CheckboxWithLabel } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core/styles';
import GoogleButton from 'react-google-button';

import getRandomString from '../util/randomString';
import { Auth } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';
import User from '../User';
import WrongCodeDialog from './WrongCodeDialog';
import ErrorDialog from './ErrorDialog';

import PolicyLink from '../PolicyLink';

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
    authFormTitle: {
        margin: '15px 0',
    },
    loader: {
        marginTop: '15px',
    },
}));

interface SignInFormValues {
    email: string;
    isAgreementChecked: boolean;
}

interface CodeFormValues {
    code: string;
}

interface UserAttributes {
    sub: string;
    email: string;
    email_verified: boolean;
}

interface CognitoUserExtended extends CognitoUser {
    attributes: UserAttributes;
}

interface LandingPageProps {
    setUser: (user: User | undefined) => void;
}

export default function LandingPage({
    setUser,
}: LandingPageProps): JSX.Element {
    const [isAgreementChecked, setIsAgreementChecked] = useState<boolean>(
        false,
    );
    const [isAgreementMessage, setIsAgreementMessage] = useState<boolean>(
        false,
    );
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [codeSent, setCodeSent] = useState<boolean>(false);
    const [failedAttempts, setFailedAttempts] = useState<number>(0);
    const [wrongCodeMessage, setWrongCodeMessage] = useState<boolean>(false);
    const [wrongCodeDialog, setWrongCodeDialog] = useState<boolean>(false);
    const [errorDialog, setErrorDialog] = useState<boolean>(false);
    const [authState, setAuthState] = useState<{
        user: CognitoUserExtended | null;
        email: string;
        status: string;
    }>();
    const classes = useStyles();

    // useEffect(() => {
    //     Auth.currentAuthenticatedUser()
    //         .then((user) => {
    //             console.log('currentUser: ', user.attributes.sub);
    //         })
    //         .catch((err) => {
    //             console.log('User not authenticated');
    //         });
    // }, []);

    const resetState = () => {
        setCodeSent(false);
        setWrongCodeMessage(false);
        setFailedAttempts(0);
        setIsAgreementChecked(false);
        setAuthState({ user: null, email: '', status: '' });
    };

    useEffect(() => {
        if (!authState) return;

        const { user, status, email } = authState;
        switch (status) {
            case 'UserNotFoundException':
                signUp(email);
                break;
            case 'signedUp':
                signIn(email);
                break;
            case 'signedIn':
                setCodeSent(true);
                setIsSubmitting(false);
                break;
            case 'authenticated':
                if (!user) return;

                console.log('TODO: Authenticate user ');
                // const newUser: User = {
                //     _id: user.attributes.sub,
                //     email: user.attributes.email,
                //     name: '',
                //     roles: [],
                // };
                // setUser(newUser);
                setIsSubmitting(false);
                break;
            case 'wrongCode':
                if (failedAttempts >= 3) {
                    setWrongCodeDialog(true);
                } else {
                    setWrongCodeMessage(true);
                }
                setIsSubmitting(false);
                break;
            case 'error':
                if (failedAttempts < 2) {
                    setErrorDialog(true);
                }
                setIsSubmitting(false);
                break;
            case 'UserLambdaValidationException':
                setErrorDialog(true);
                setIsSubmitting(false);
                break;
            default:
                setIsSubmitting(false);
                console.log(authState);
                break;
        }
    }, [authState, failedAttempts]);

    const signUp = (email: string) => {
        const params = {
            username: email,
            password: getRandomString(30),
            attributes: {
                email,
            },
        };

        Auth.signUp(params)
            .then((res) => {
                setAuthState({ user: null, email, status: 'signedUp' });
            })
            .catch((err) => {
                setAuthState({ user: null, email, status: err.code });
            });
    };

    const signIn = async (email: string, resetForm?: () => void) => {
        Auth.signIn(email)
            .then((user) => {
                setAuthState({ user, email, status: 'signedIn' });
                if (resetForm) resetForm();
            })
            .catch((err) => {
                setAuthState({ user: null, email, status: err.code });
            });
    };

    const submitVerificationCode = async (code: string) => {
        if (!authState?.user) return;

        try {
            await Auth.sendCustomChallengeAnswer(authState.user, code);
        } catch (err) {
            setAuthState({
                user: authState.user,
                email: '',
                status: 'error',
            });
        }

        Auth.currentAuthenticatedUser()
            .then((user) => {
                setAuthState({
                    user,
                    email: '',
                    status: 'authenticated',
                });
            })
            .catch((err) => {
                setFailedAttempts((val) => val + 1);
                setAuthState({
                    user: authState.user,
                    email: '',
                    status: 'wrongCode',
                });
            });
    };

    useEffect(() => {
        setTimeout(() => {
            Auth.signOut().then(() => console.log('signed out'));
        }, 1000);
    }, []);

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

            {!codeSent && (
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
            )}

            <Typography className={classes.authFormTitle}>
                {codeSent
                    ? 'Enter verification code sent to your email address'
                    : 'Or sign in with email'}
            </Typography>

            {!codeSent && (
                <Formik
                    initialValues={{ email: '', isAgreementChecked: false }}
                    validate={(values) => {
                        const errors: Partial<SignInFormValues> = {};
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
                    onSubmit={(values, { resetForm }) => {
                        setIsSubmitting(true);
                        signIn(values.email, resetForm);
                    }}
                >
                    {({ errors, touched, submitForm }) => (
                        <Form>
                            <Field
                                className={classes.emailField}
                                variant="outlined"
                                fullWidth={true}
                                component={TextField}
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                                Label={{
                                    label: (
                                        <small>
                                            By creating an account, I accept the
                                            Global.health TOS and Privacy
                                            Policy, and agree to be added to the
                                            newsletter
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
            )}
            {codeSent && (
                <Formik
                    initialValues={{ code: '' }}
                    validate={(values) => {
                        const errors: Partial<CodeFormValues> = {};

                        if (wrongCodeMessage) {
                            setWrongCodeMessage(false);
                        }

                        if (!values.code) {
                            errors.code = 'Required';
                        }

                        return errors;
                    }}
                    onSubmit={(values) => {
                        setIsSubmitting(true);
                        submitVerificationCode(values.code);
                    }}
                >
                    {({ submitForm }) => (
                        <Form>
                            <Field
                                className={classes.emailField}
                                variant="outlined"
                                fullWidth={true}
                                component={TextField}
                                disabled={isSubmitting}
                                name="code"
                                type="text"
                                label="Verification code"
                            />
                            {wrongCodeMessage && (
                                <FormHelperText error>
                                    Wrong verification code entered
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
                                Submit
                            </Button>
                        </Form>
                    )}
                </Formik>
            )}
            <WrongCodeDialog
                isOpen={wrongCodeDialog}
                setIsOpen={setWrongCodeDialog}
                onClose={resetState}
            />
            <ErrorDialog isOpen={errorDialog} setIsOpen={setErrorDialog} />
            <HealthmapInsignias />
        </Paper>
    );
}

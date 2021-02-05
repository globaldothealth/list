import React, { useState, useEffect } from 'react';
import { ReactComponent as HealthmapInsignias } from '../assets/healthmap_insignias.svg';
import { Paper, Typography } from '@material-ui/core';
import { Theme, makeStyles } from '@material-ui/core/styles';
import GoogleButton from 'react-google-button';
import { useLastLocation } from 'react-router-last-location';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import getRandomString from '../util/randomString';
import { Auth } from 'aws-amplify';
import { CognitoUser } from '@aws-amplify/auth';
import User from '../User';
import WrongCodeDialog from './WrongCodeDialog';
import ErrorDialog from './ErrorDialog';
import axios from 'axios';
import SignInForm from './SignInForm';
import VerificationCodeForm from './VerificationCodeForm';

import PolicyLink from '../PolicyLink';

interface StylesProps {
    smallHeight: boolean;
}

const useStyles = makeStyles((theme: Theme) => ({
    paper: {
        position: 'absolute',
        top: (props: StylesProps) => (props.smallHeight ? '64px' : '50%'),
        left: '50%',
        transform: (props: StylesProps) =>
            props.smallHeight ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',

        height: 'auto',
        maxWidth: '100%',
        padding: '45px',
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
    const smallHeight = useMediaQuery('(max-height:850px)');
    const classes = useStyles({ smallHeight });
    const lastLocation = useLastLocation();

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

                axios
                    .post('/auth/signup', {
                        name: undefined,
                        email: user.attributes.email,
                        roles: [],
                    })
                    .then((res) => {
                        const { _id, email, name, roles, picture } = res.data;
                        const newUser: User = {
                            _id,
                            email,
                            name,
                            roles,
                            picture,
                        };
                        setUser(newUser);
                        setIsSubmitting(false);
                    })
                    .catch((err) => {
                        setErrorDialog(true);
                        setIsSubmitting(false);
                    });
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
            default:
                setErrorDialog(true);
                setIsSubmitting(false);
                break;
        }
    }, [authState, failedAttempts, setUser]);

    useEffect(() => {
        if (!lastLocation || lastLocation.search === '') return;

        localStorage.setItem('searchQuery', lastLocation.search);
    }, [lastLocation]);

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
        setIsSubmitting(true);

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
        setIsSubmitting(true);

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
                        <a
                            href="https://test-globalhealth.pantheonsite.io/terms-of-use/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Terms of use
                        </a>
                    </div>
                    <div className={classes.link}>
                        <a
                            href="https://test-globalhealth.pantheonsite.io/privacy/"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Privacy policy
                        </a>
                    </div>
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
                <SignInForm
                    handleSubmit={signIn}
                    isAgreementChecked={isAgreementChecked}
                    setIsAgreementChecked={setIsAgreementChecked}
                    setIsAgreementMessage={setIsAgreementMessage}
                    isAgreementMessage={isAgreementMessage}
                    isSubmitting={isSubmitting}
                    classes={{
                        emailField: classes.emailField,
                        loader: classes.loader,
                        signInButton: classes.signInButton,
                    }}
                />
            )}
            {codeSent && (
                <VerificationCodeForm
                    handleSubmit={submitVerificationCode}
                    setWrongCodeMessage={setWrongCodeMessage}
                    wrongCodeMessage={wrongCodeMessage}
                    isSubmitting={isSubmitting}
                    classes={{
                        emailField: classes.emailField,
                        loader: classes.loader,
                        signInButton: classes.signInButton,
                    }}
                />
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

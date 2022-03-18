import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@material-ui/core';
import { Theme, makeStyles } from '@material-ui/core/styles';
import { useLastLocation } from 'react-router-last-location';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    selectIsLoading,
    selectError,
    selectForgotPasswordPopupOpen,
    selectSnackbar,
} from '../../redux/auth/selectors';
import { resetError, toggleSnackbar } from '../../redux/auth/slice';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ChangePasswordForm from './ChangePasswordForm';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';

import PolicyLink from '../PolicyLink';
import PartnerLogos from './PartnerLogos';
import { SnackbarAlert } from '../SnackbarAlert';

import { useParams, Link } from 'react-router-dom';

import Helmet from 'react-helmet';
import { getVersion } from '../../redux/app/thunk';
import { selectVersion, selectEnv } from '../../redux/app/selectors';
import { MapLink } from '../../constants/types';

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
        width: '1000px',
    },
    body: {
        display: 'flex',
        marginTop: '20px',
        [theme.breakpoints.down(770)]: {
            marginBottom: '60px',
        },
        [theme.breakpoints.down(460)]: {
            flexFlow: 'column',
            rowGap: '30px',
        },
    },
    description: {
        color: theme.custom.palette.landingPage.descriptionTextColor,
        marginRight: '90px',
        width: '60%',
        [theme.breakpoints.down(460)]: {
            width: '100%',
        },
    },
    linksContainer: {
        width: '40%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    link: {
        display: 'block',
        margin: '4px 0',
    },

    registerLengend: {
        color: theme.custom.palette.landingPage.descriptionTextColor,
    },
    emailField: {
        display: 'block',
        width: '240px',
    },
    divider: {
        marginTop: '15px',
    },
    signInButton: {
        margin: '15px 0',
        display: 'block',
    },
    authFormTitle: {
        margin: '15px 0',
    },
}));

interface UrlParams {
    token?: string;
    id?: string;
}
interface StyleProps {
    classes: {
        linksContainer: string;
        link: string;
    };
}

const MoreInformationLinks = ({
    classes,
    version,
    env,
}: StyleProps & { version: string; env: string }) => {
    return (
        <div className={classes.linksContainer}>
            <div>
                <Typography>More information</Typography>
                <div className={classes.link}>Version: {version}</div>
                <div className={classes.link}>
                    <a
                        href="https://global.health/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Global.health website
                    </a>
                </div>
                <div className={classes.link}>
                    <a
                        href={MapLink[env]}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Global.health map
                    </a>
                </div>
                <div className={classes.link}>
                    <a
                        href="https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Data dictionary
                    </a>
                </div>
                <div className={classes.link}>
                    <Link to="/data-acknowledgments">Data acknowledgments</Link>
                </div>
                <div className={classes.link}>
                    <a
                        href="https://global.health/terms-of-use/"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Terms of use
                    </a>
                </div>
                <div className={classes.link}>
                    <a
                        href="https://global.health/privacy/"
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
    );
};

const LandingPage = (): JSX.Element => {
    const dispatch = useAppDispatch();

    const smallHeight = useMediaQuery('(max-height:1050px)');
    const classes = useStyles({ smallHeight });
    const lastLocation = useLastLocation();
    const [registrationScreenOn, setRegistrationScreenOn] = useState(true);
    const [changePasswordScreenOn, setChangePasswordScreenOn] = useState(false);

    const isLoading = useAppSelector(selectIsLoading);
    const error = useAppSelector(selectError);
    const forgotPasswordPopupOpen = useAppSelector(
        selectForgotPasswordPopupOpen,
    );
    const { isOpen, message } = useAppSelector(selectSnackbar);
    const version = useAppSelector(selectVersion);
    const env = useAppSelector(selectEnv);

    // Url parameters from reset password link
    const { token, id } = useParams<UrlParams>();

    useEffect(() => {
        if (!token || !id) {
            setChangePasswordScreenOn(false);
        } else {
            setChangePasswordScreenOn(true);
        }
        // eslint-disable-next-line
    }, [token, id]);

    // Reset errors when switching between sign in/up forms
    useEffect(() => {
        if (!error) return;

        dispatch(resetError());

        // eslint-disable-next-line
    }, [dispatch, registrationScreenOn]);

    // Store searchQuery in localStorage to apply filters after going through login process
    useEffect(() => {
        if (!lastLocation || lastLocation.search === '') return;

        localStorage.setItem('searchQuery', lastLocation.search);
    }, [lastLocation]);

    // retrieve the app version from the curator service
    useEffect(() => {
        dispatch(getVersion());
    }, [dispatch]);

    return (
        <>
            <Helmet>
                <title>Global.health | Data</title>
            </Helmet>
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
                    <MoreInformationLinks
                        classes={classes}
                        version={version}
                        env={env}
                    />
                </div>

                {registrationScreenOn && !changePasswordScreenOn ? (
                    <SignUpForm
                        disabled={isLoading}
                        setRegistrationScreenOn={setRegistrationScreenOn}
                    />
                ) : (
                    !changePasswordScreenOn && (
                        <SignInForm
                            disabled={isLoading}
                            setRegistrationScreenOn={setRegistrationScreenOn}
                        />
                    )
                )}
                {changePasswordScreenOn && (
                    <ChangePasswordForm
                        token={token}
                        id={id}
                        disabled={isLoading}
                    />
                )}

                {isLoading && !forgotPasswordPopupOpen && (
                    <LinearProgress color="primary" />
                )}

                {error && !forgotPasswordPopupOpen && (
                    <Alert
                        severity="error"
                        onClose={() => dispatch(resetError())}
                    >
                        {error}
                    </Alert>
                )}

                <SnackbarAlert
                    isOpen={isOpen}
                    type="success"
                    message={message}
                    durationMs={5000}
                    onClose={(open: boolean) =>
                        dispatch(toggleSnackbar({ isOpen: open, message: '' }))
                    }
                />

                <PartnerLogos />
            </Paper>
        </>
    );
};

export default LandingPage;

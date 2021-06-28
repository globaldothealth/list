import React, { useEffect, useState } from 'react';
import { Paper, Typography } from '@material-ui/core';
import { Theme, makeStyles } from '@material-ui/core/styles';
import { useLastLocation } from 'react-router-last-location';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import { CognitoUser } from '@aws-amplify/auth';
import User from '../User';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ChangePasswordForm from './ChangePasswordForm';

import PolicyLink from '../PolicyLink';
import PartnerLogos from './PartnerLogos';

import { useParams, withRouter} from 'react-router-dom';
import {RouteComponentProps} from "react-router";


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
    },
    description: {
        color: theme.custom.palette.landingPage.descriptionTextColor,
        marginRight: '90px',
        width: '60%',
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
    loader: {
        marginTop: '15px',
    },
}));

interface UserAttributes {
    sub: string;
    email: string;
    email_verified: boolean;
}

interface LocationState {
    search: string;
}

interface CognitoUserExtended extends CognitoUser {
    attributes: UserAttributes;
}

interface LandingPageProps extends RouteComponentProps {
    setUser: (user: User | undefined) => void;
    changePassword: boolean;
}

const LandingPage = withRouter(({
    // setUser,
    changePassword,
    history
}: LandingPageProps): JSX.Element => {
    const smallHeight = useMediaQuery('(max-height:1050px)');
    const classes = useStyles({ smallHeight });
    const lastLocation = useLastLocation();
    const [registrationScreenOn, setRegistrationScreenOn] = useState(false);
    
interface UrlParams {
    id: string;
}

    // the params sent from the url
    let { id } = useParams<UrlParams>();        

    // Store searchQuery in localStorage to apply filters after going through login process
    useEffect(() => {
        if (!lastLocation || lastLocation.search === '') return;

        localStorage.setItem('searchQuery', lastLocation.search);
    }, [lastLocation]);

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
                <div className={classes.linksContainer}>
                    <div>
                        <Typography>More information</Typography>
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
                                href="https://map.covid-19.global.health/"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Global.health map
                            </a>
                        </div>
                        <div className={classes.link}>
                            <a
                                href="https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/functions/01-split/fields.txt"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Data dictionary
                            </a>
                        </div>
                        <div className={classes.link}>
                            <a
                                href="https://global.health/acknowledgement/"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Data acknowledgments
                            </a>
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
            </div>

            {registrationScreenOn && !changePassword ? (
                <SignUpForm setRegistrationScreenOn={setRegistrationScreenOn} />
            ) : (
                !changePassword && (
                    <SignInForm
                        setRegistrationScreenOn={setRegistrationScreenOn}
                    />
                )
            )}
            {changePassword && <ChangePasswordForm />}

            <PartnerLogos />
        </Paper>
    );
});


export default LandingPage;
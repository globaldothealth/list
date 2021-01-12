import React, { useState } from 'react';
import { ReactComponent as HealthmapInsignias } from './assets/healthmap_insignias.svg';
import { Link } from 'react-router-dom';
import {
    FormControlLabel,
    FormGroup,
    Paper,
    Typography,
    Checkbox,
    FormHelperText,
} from '@material-ui/core';
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
    loginButton: {
        margin: '35px 0 15px',
    },
    registerLengend: {
        color: '#838D89',
    },
    checkboxRow: {
        display: 'flex',
    },
}));

export default function LandingPage(): JSX.Element {
    const [isAgreementChecked, setIsAgreementChecked] = useState(false);
    const [isAgreementMessage, setIsAgreementMessage] = useState(false);
    const classes = useStyles();
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
            {isAgreementChecked && (
                <a href={process.env.REACT_APP_LOGIN_URL}>
                    <GoogleButton className={classes.loginButton} />
                </a>
            )}
            {!isAgreementChecked && (
                <GoogleButton
                    className={classes.loginButton}
                    onClick={() => {
                        setIsAgreementMessage(true);
                    }}
                />
            )}
            <FormGroup className={classes.checkboxRow}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isAgreementChecked}
                            onChange={(
                                event: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                                setIsAgreementChecked(event.target.checked);
                                setIsAgreementMessage(false);
                            }}
                            name="isAgreementChecked"
                        />
                    }
                    label={
                        <small>
                            By creating an account, I accept the Global.health
                            TOS and Privacy Policy, and agree to be added to the
                            newsletter.
                        </small>
                    }
                />
                {isAgreementMessage && (
                    <FormHelperText error>
                        This agreement is required
                    </FormHelperText>
                )}
            </FormGroup>
            <HealthmapInsignias />
        </Paper>
    );
}

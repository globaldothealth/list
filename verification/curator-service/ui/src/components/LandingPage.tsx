import { Paper, Typography } from '@material-ui/core';

import { ReactComponent as HealthmapInsignias } from './assets/healthmap_insignias.svg';
import { Link } from 'react-router-dom';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    paper: {
        height: '440px',
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
        margin: '4px 0',
    },
    loginLink: {
        margin: '25px 0',
    },
}));

export default function LandingPage(): JSX.Element {
    const classes = useStyles();
    return (
        <Paper classes={{ root: classes.paper }}>
            <Typography variant="h4">
                Trustworthy line list data to power your research
            </Typography>
            <div className={classes.body}>
                <Typography
                    classes={{ root: classes.description }}
                    variant="h5"
                >
                    Welcome to G.h List. The first of its kind, easy to use
                    global data repository with open access to real-time
                    epidemiological anonymized line list data.
                </Typography>
                <div>
                    <Typography>More information</Typography>
                    <div className={classes.link}>
                        {/* TODO: add prod link once available */}
                        <a>Global.health website</a>
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
                </div>
            </div>
            <Typography variant="h6" classes={{ root: classes.loginLink }}>
                <a href={process.env.REACT_APP_LOGIN_URL}>
                    Login to get started
                </a>
            </Typography>
            <HealthmapInsignias />
        </Paper>
    );
}

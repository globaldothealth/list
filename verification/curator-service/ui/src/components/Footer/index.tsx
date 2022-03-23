import React from 'react';
import { Link } from 'react-router-dom';

import GitHubIcon from '@material-ui/icons/GitHub';
import TwitterIcon from '@material-ui/icons/Twitter';
import LinkedInIcon from '@material-ui/icons/LinkedIn';
import { useStyles } from './styled';
import PolicyLink from '../PolicyLink';

const Footer = (): JSX.Element => {
    const classes = useStyles();

    return (
        <footer className={classes.root}>
            <section className={classes.socialMediaContainer}>
                <a
                    href="https://www.github.com/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <GitHubIcon className="icon" />
                </a>

                <a
                    href="https://www.linkedin.com/company/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <LinkedInIcon className="icon" />
                </a>
                <a
                    href="https://twitter.com/globaldothealth"
                    target="_blank"
                    rel="noreferrer"
                    className={classes.socialMediaButton}
                >
                    <TwitterIcon className="icon" />
                </a>
            </section>

            <section>
                <a
                    href="https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt"
                    rel="noopener noreferrer"
                    target="_blank"
                    data-testid="dictionaryButton"
                    className={classes.link}
                >
                    Data dictionary
                </a>
                <Link
                    to="/data-acknowledgments"
                    className={classes.link}
                    data-testid="acknowledgmentsButton"
                >
                    Data acknowledgments
                </Link>
                <a
                    href="https://global.health/terms-of-use"
                    rel="noopener noreferrer"
                    target="_blank"
                    className={classes.link}
                    data-testid="termsButton"
                >
                    Terms of use
                </a>
                <a
                    href="https://global.health/privacy/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className={classes.link}
                    data-testid="privacypolicybutton"
                >
                    Privacy policy
                </a>
                <PolicyLink
                    type="cookie-policy"
                    classes={{
                        root: classes.link,
                    }}
                >
                    Cookie policy
                </PolicyLink>
                <a
                    href="mailto:info@global.health?subject=Feedback regarding Global.health data portal"
                    className={classes.link}
                >
                    Feedback
                </a>
            </section>
        </footer>
    );
};

export default Footer;

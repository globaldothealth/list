import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useStyles } from './styled';
import PolicyLink from '../PolicyLink';
import FeedbackEmailDialog from '../FeedbackEmailDialog';
import Typography from '@material-ui/core/Typography';

interface FooterProps {
    drawerOpen: boolean;
}

const Footer = ({ drawerOpen }: FooterProps): JSX.Element => {
    const classes = useStyles();
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    const openFeedbackModal = () => {
        setFeedbackModalOpen(true);
    };

    const closeFeedbackModal = () => {
        setFeedbackModalOpen(false);
    };

    return (
        <footer
            className={clsx(classes.root, {
                [classes.contentShift]: drawerOpen,
            })}
        >
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
                    href="https://global.health/faqs/"
                    rel="noopener noreferrer"
                    target="_blank"
                    className={classes.link}
                >
                    FAQs
                </a>
                <a
                    href="https://github.com/globaldothealth/list/tree/main/api"
                    rel="noopener noreferrer"
                    target="_blank"
                    className={classes.link}
                >
                    API
                </a>
                <Typography
                    display="inline"
                    className={classes.feedbackButton}
                    onClick={openFeedbackModal}
                >
                    Feedback
                </Typography>
                <FeedbackEmailDialog
                    isOpen={feedbackModalOpen}
                    closeFeedbackModal={closeFeedbackModal}
                />
            </section>
        </footer>
    );
};

export default Footer;

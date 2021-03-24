import React from 'react';
import { Typography } from '@material-ui/core';
import { Theme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import clsx from 'clsx';

import bch from '../assets/partner-logos/bch.png';
import georgetown from '../assets/partner-logos/georgetown.png';
import hopkins from '../assets/partner-logos/hopkins.png';
import harvard from '../assets/partner-logos/harvard.png';
import washington from '../assets/partner-logos/washington.png';
import northeastern from '../assets/partner-logos/northeastern.png';
import oxford from '../assets/partner-logos/oxford.png';

import google from '../assets/partner-logos/google.png';
import oxfordMartin from '../assets/partner-logos/oxford-martin.png';
import rockefeller from '../assets/partner-logos/rockefeller.png';

interface StylesProps {
    smallWidth: boolean;
}

const useStyles = makeStyles((theme: Theme) => ({
    logosContainer: {
        display: 'flex',
        flexDirection: (props: StylesProps) =>
            props.smallWidth ? 'column' : 'row',

        alignItems: (props: StylesProps) =>
            props.smallWidth ? 'flex-start' : 'center',

        marginTop: '10px',
        '&.fullWidth': {
            justifyContent: 'space-evenly',
        },
    },
    logo: {
        maxWidth: '100px',
        height: 'auto',
        '&.big': {
            maxWidth: '120px',
        },
    },
    title: {
        marginTop: '20px',
        color: theme.custom.palette.landingPage.descriptionTextColor,
    },
}));

export default function PartnerLogos(): JSX.Element {
    const smallWidth = useMediaQuery('(max-width:700px)');
    const classes = useStyles({ smallWidth });
    const logos = [
        bch,
        georgetown,
        harvard,
        hopkins,
        northeastern,
        oxford,
        washington,
    ];

    const fundingLogos = [google, oxfordMartin, rockefeller];

    const renderedLogos = logos.map((logo, idx) => (
        <img
            key={idx}
            src={logo}
            className={clsx({ [classes.logo]: true, big: idx === 1 })}
            alt="Partner logo"
        />
    ));

    const renderedFundingLogos = fundingLogos.map((logo, idx) => (
        <img src={logo} className={classes.logo} key={idx} alt="Partner logo" />
    ));

    return (
        <>
            <Typography className={classes.title}>
                Participating Institutions:
            </Typography>
            <section className={`${classes.logosContainer} fullWidth`}>
                {renderedLogos}
            </section>

            <Typography className={classes.title}>
                With Funding From:
            </Typography>
            <section className={classes.logosContainer}>
                {renderedFundingLogos}
            </section>
        </>
    );
}

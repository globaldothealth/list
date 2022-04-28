import React from 'react';
import { Typography } from '@mui/material';
import { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import useMediaQuery from '@mui/material/useMediaQuery';
import clsx from 'clsx';

import bch from '../assets/partner-logos/bch.png';
import georgetown from '../assets/partner-logos/georgetown.png';
import gorgas from '../assets/partner-logos/gorgas.png';
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
            props.smallWidth ? 'center' : 'flex-start',

        marginTop: '10px',
        '&.fullWidth': {
            justifyContent: 'space-evenly',
            alignItems: 'center',
        },
    },
    logo: {
        maxWidth: '100px',
        height: 'auto',
        '&.big': {
            maxWidth: '120px',
        },
        '&.gray': {
            WebkitFilter: 'grayscale(100%)',
            filter: 'grayscale(100%)',
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
        gorgas,
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
            className={clsx({
                [classes.logo]: true,
                gray: true,
                big: idx === 1,
            })}
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

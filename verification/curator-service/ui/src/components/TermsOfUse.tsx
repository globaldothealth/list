import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    root: {
        marginTop: '12px',
        width: '80%',
    },
}));

export default function TermsOfUse(): JSX.Element {
    const classes = styles();
    return (
        <div className={classes.root}>
            <Typography variant="h5">Global.health Terms of Use</Typography>
            <Typography variant="body1">
                <ol>
                    <li>
                        The Global.health website and its contents herein,
                        including all data and mapping are the copyright of
                        Boston Children's Hospital, all rights reserved. When
                        linking to the website, attribute the Website as{' '}
                        <a
                            href="http://www.global.health"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            www.global.health
                        </a>
                    </li>
                    <li>
                        The Global.health data is licensed under{' '}
                        <a
                            href="https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Creative Commons Attribution 4.0 International
                        </a>{' '}
                        by the Boston Children's Hospital. Attribute any use of
                        the data to: Global.health consortium, Detailed
                        Epidemiological Data from the COVID-19 Outbreak,
                        Accessed on yyyy-mm-dd from global.health and: Xu, B.,
                        Gutierrez, B., Mekaru, S. et al. Epidemiological data
                        from the COVID-19 outbreak, real-time case information.
                        Sci Data 7, 106 (2020).{' '}
                        <a
                            href="https://doi.org/10.1038/s41597-020-0448-0"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            https://doi.org/10.1038/s41597-020-0448-0
                        </a>
                    </li>
                </ol>
            </Typography>
        </div>
    );
}

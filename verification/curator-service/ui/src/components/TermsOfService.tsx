import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    root: {
        marginTop: '12px',
        width: '80%',
    },
}));

export default function TermsOfService(): JSX.Element {
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
                        linking to the website, attribute the Website as
                        "Global.health....."
                    </li>
                    <li>
                        The Global.health data is licensed under Creative
                        Commons Attribution 4.0 International by the Boston
                        Children's Hospital. Attribute any use of the data to
                        "TBC"
                    </li>
                    <li>
                        For any publications that use the Global.health data,
                        please cite the publication: Xu, B., Gutierrez, B.,
                        Mekaru, S. et al. Epidemiological data from the COVID-19
                        outbreak, real-time case information. Sci Data 7, 106
                        (2020).{' '}
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

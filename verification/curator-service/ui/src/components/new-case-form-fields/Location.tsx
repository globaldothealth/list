import { Divider, Typography } from '@material-ui/core';

import { Location as Loc } from '../Case';
import React from 'react';
import StaticMap from '../StaticMap';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    column: {
        marginRight: '1em',
    },
    mapContainer: {
        textAlign: 'center',
    },
    divider: {
        marginBottom: '1em',
    },
}));

export default function Location(props: { location?: Loc }): JSX.Element {
    const classes = styles();
    return (
        <>
            <div className={classes.root}>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Location Type</Typography>
                    </p>
                    <p>{props.location?.geoResolution}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Country</Typography>
                    </p>
                    <p>{props.location?.country}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 1</Typography>
                    </p>
                    <p>{props.location?.administrativeAreaLevel1 || 'N/A'}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 2</Typography>
                    </p>
                    <p>{props.location?.administrativeAreaLevel2 || 'N/A'}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 3</Typography>
                    </p>
                    <p>{props.location?.administrativeAreaLevel3 || 'N/A'}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Latitude</Typography>
                    </p>
                    <p>
                        {props.location?.geometry?.latitude?.toFixed(4) || '-'}
                    </p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Longitude</Typography>
                    </p>
                    <p>
                        {props.location?.geometry?.longitude?.toFixed(4) || '-'}
                    </p>
                </div>
            </div>
            {props.location?.geometry !== undefined && (
                <div className={classes.mapContainer}>
                    <Divider className={classes.divider} variant="middle" />
                    <StaticMap location={props.location}></StaticMap>
                </div>
            )}
        </>
    );
}

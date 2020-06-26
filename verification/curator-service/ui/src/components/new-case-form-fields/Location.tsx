import { Typography, withStyles } from '@material-ui/core';

import React from 'react';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { createStyles } from '@material-ui/core/styles';

const styles = () =>
    createStyles({
        root: {
            display: 'flex',
            flexWrap: 'wrap',
        },
        column: {
            marginRight: '1em',
        },
    });

// TODO: Replace with Case's Location interface definition.
export interface Loc {
    geometry: {
        latitude: number;
        longitude: number;
    };
    country: string;
    // First administrative division (state in the US, Länder in Germany, ...).
    administrativeAreaLevel1: string | undefined;
    // Second administrative division (county in the US, departments in France, ...).
    administrativeAreaLevel2: string | undefined;
    // Third administrative division (cities usually).
    administrativeAreaLevel3: string | undefined;
    // A precise location, such as an establishment or POI.
    place: string | undefined;
    // Human readable place name.
    name: string;
    // How granular the geocode is.
    geoResolution: string;
}

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    location?: Loc;
}

class Location extends React.Component<Props, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Location Type</Typography>
                    </p>
                    <p>{this.props.location?.geoResolution}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Country</Typography>
                    </p>
                    <p>{this.props.location?.country}</p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 1</Typography>
                    </p>
                    <p>
                        {this.props.location?.administrativeAreaLevel1 || 'N/A'}
                    </p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 2</Typography>
                    </p>
                    <p>
                        {this.props.location?.administrativeAreaLevel2 || 'N/A'}
                    </p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Admin area 3</Typography>
                    </p>
                    <p>
                        {this.props.location?.administrativeAreaLevel3 || 'N/A'}
                    </p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Latitude</Typography>
                    </p>
                    <p>
                        {this.props.location?.geometry?.latitude?.toFixed(4) ||
                            '-'}
                    </p>
                </div>
                <div className={classes.column}>
                    <p>
                        <Typography variant="caption">Longitude</Typography>
                    </p>
                    <p>
                        {this.props.location?.geometry?.longitude?.toFixed(4) ||
                            '-'}
                    </p>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(Location);

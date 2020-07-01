import { Container, Divider, Typography, withStyles } from '@material-ui/core';

import { Location as Loc } from '../Case';
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
        iframe: {
            border: 'none',
            display: 'inline-block',
        },
        map: {
            textAlign: 'center',
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    location?: Loc;
}

class Location extends React.Component<Props, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <>
                <div className={classes.root}>
                    <div className={classes.column}>
                        <p>
                            <Typography variant="caption">
                                Location Type
                            </Typography>
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
                            <Typography variant="caption">
                                Admin area 1
                            </Typography>
                        </p>
                        <p>
                            {this.props.location?.administrativeAreaLevel1 ||
                                'N/A'}
                        </p>
                    </div>
                    <div className={classes.column}>
                        <p>
                            <Typography variant="caption">
                                Admin area 2
                            </Typography>
                        </p>
                        <p>
                            {this.props.location?.administrativeAreaLevel2 ||
                                'N/A'}
                        </p>
                    </div>
                    <div className={classes.column}>
                        <p>
                            <Typography variant="caption">
                                Admin area 3
                            </Typography>
                        </p>
                        <p>
                            {this.props.location?.administrativeAreaLevel3 ||
                                'N/A'}
                        </p>
                    </div>
                    <div className={classes.column}>
                        <p>
                            <Typography variant="caption">Latitude</Typography>
                        </p>
                        <p>
                            {this.props.location?.geometry?.latitude?.toFixed(
                                4,
                            ) || '-'}
                        </p>
                    </div>
                    <div className={classes.column}>
                        <p>
                            <Typography variant="caption">Longitude</Typography>
                        </p>
                        <p>
                            {this.props.location?.geometry?.longitude?.toFixed(
                                4,
                            ) || '-'}
                        </p>
                    </div>
                </div>
                {this.props.location?.geometry !== undefined && (
                    <div className={classes.map}>
                        <Divider variant="middle" />
                        <iframe
                            className={classes.iframe}
                            title="map"
                            src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${this.props.location?.geometry?.longitude},${this.props.location?.geometry?.latitude},5,0/300x200?access_token=${process.env.REACT_MAPBOX_TOKEN}`}
                        ></iframe>
                    </div>
                )}
            </>
        );
    }
}

export default withStyles(styles)(Location);

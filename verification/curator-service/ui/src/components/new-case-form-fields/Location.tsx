import { Divider, MenuItem } from '@material-ui/core';
import { Select, TextField } from 'formik-material-ui';

import { FastField } from 'formik';
import FormControl from '@material-ui/core/FormControl';
import { Geometry } from '../Case';
import InputLabel from '@material-ui/core/InputLabel';
import React from 'react';
import StaticMap from '../StaticMap';
import { makeStyles } from '@material-ui/core/styles';

const styles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    field: {
        marginRight: '1em',
        width: '8em',
    },
    mapContainer: {
        textAlign: 'center',
    },
    divider: {
        marginTop: '1em',
        marginBottom: '1em',
    },
}));

export default function Location(props: {
    locationPath: string;
    geometry?: Geometry;
}): JSX.Element {
    const classes = styles();
    return (
        <>
            <div className={classes.root}>
                <FormControl className={classes.field}>
                    <InputLabel
                        htmlFor={`${props.locationPath}.geoResolution`}
                        shrink
                    >
                        Geo resolution
                    </InputLabel>
                    <FastField
                        as="select"
                        id={`${props.locationPath}.geoResolution`}
                        name={`${props.locationPath}.geoResolution`}
                        type="text"
                        component={Select}
                    >
                        {['Point', 'Admin3', 'Admin2', 'Admin1', 'Country'].map(
                            (res) => (
                                <MenuItem key={res} value={res}>
                                    {res}
                                </MenuItem>
                            ),
                        )}
                    </FastField>
                </FormControl>
                <FastField
                    className={classes.field}
                    label="Name"
                    name={`${props.locationPath}.name`}
                    type="text"
                    required
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Country"
                    name={`${props.locationPath}.country`}
                    type="text"
                    required
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Admin area 1"
                    name={`${props.locationPath}.administrativeAreaLevel1`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Admin area 2"
                    name={`${props.locationPath}.administrativeAreaLevel2`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Admin area 3"
                    name={`${props.locationPath}.administrativeAreaLevel3`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Latitude"
                    name={`${props.locationPath}.geometry.latitude`}
                    type="number"
                    required
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <FastField
                    className={classes.field}
                    label="Longitude"
                    name={`${props.locationPath}.geometry.longitude`}
                    type="number"
                    required
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            {props.geometry?.latitude && props.geometry?.longitude && (
                <div className={classes.mapContainer}>
                    <Divider className={classes.divider} variant="middle" />
                    <StaticMap geometry={props.geometry}></StaticMap>
                </div>
            )}
        </>
    );
}

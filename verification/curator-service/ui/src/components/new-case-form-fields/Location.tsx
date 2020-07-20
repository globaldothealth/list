import { Divider } from '@material-ui/core';
import { Field } from 'formik';
import { Geometry } from '../Case';
import React from 'react';
import StaticMap from '../StaticMap';
import { TextField } from 'formik-material-ui';
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
                <Field
                    className={classes.field}
                    disabled
                    label="Location type"
                    size="small"
                    name={`${props.locationPath}.geoResolution`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Country"
                    name={`${props.locationPath}.country`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Admin area 1"
                    name={`${props.locationPath}.administrativeAreaLevel1`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Admin area 2"
                    name={`${props.locationPath}.administrativeAreaLevel2`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Admin area 3"
                    name={`${props.locationPath}.administrativeAreaLevel3`}
                    type="text"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Latitude"
                    name={`${props.locationPath}.geometry.latitude`}
                    type="number"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Field
                    className={classes.field}
                    disabled
                    label="Longitude"
                    name={`${props.locationPath}.geometry.longitude`}
                    type="number"
                    component={TextField}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            {props.geometry && (
                <div className={classes.mapContainer}>
                    <Divider className={classes.divider} variant="middle" />
                    <StaticMap geometry={props.geometry}></StaticMap>
                </div>
            )}
        </>
    );
}

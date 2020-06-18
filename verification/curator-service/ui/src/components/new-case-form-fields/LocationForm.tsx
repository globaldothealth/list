import { Field } from 'formik';
import Location from './Location';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from '@material-ui/core';

const LocationForm = (): JSX.Element => {
    // TODO: suggest and pass location.
    return (
        <Scroll.Element name="location">
            <fieldset>
                <legend>Location</legend>
                <Field
                    label="Location"
                    name="locationQuery"
                    type="text"
                    component={TextField}
                />
                <Location location={undefined} />
            </fieldset>
        </Scroll.Element>
    );
};

export default LocationForm;

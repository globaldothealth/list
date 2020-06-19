import { Field } from 'formik';
import Location from './Location';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

class LocationForm extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            // TODO: suggest and pass location.
            <Scroll.Element name="location">
                <fieldset>
                    <legend>Location</legend>
                    <Field
                        label="Location"
                        name="locationQuery"
                        type="text"
                        fullWidth={true}
                        component={TextField}
                    />
                    <Location location={undefined} />
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default LocationForm;

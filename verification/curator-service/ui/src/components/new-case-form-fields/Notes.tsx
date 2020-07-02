import { FastField } from 'formik';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default function Notes(): JSX.Element {
    return (
        <Scroll.Element name="notes">
            <fieldset>
                <legend>Notes</legend>
                <FastField
                    label="Notes"
                    name="notes"
                    type="text"
                    multiline={true}
                    component={TextField}
                    fullWidth
                />
            </fieldset>
        </Scroll.Element>
    );
}

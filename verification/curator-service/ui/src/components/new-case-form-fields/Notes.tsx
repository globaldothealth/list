import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default function Notes(): JSX.Element {
    return (
        <Scroll.Element name="notes">
            <FieldTitle title="Notes"></FieldTitle>
            <FastField
                label="Notes"
                name="notes"
                type="text"
                multiline={true}
                component={TextField}
                fullWidth
            />
        </Scroll.Element>
    );
}

import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default function NumCases(): JSX.Element {
    return (
        <Scroll.Element name="numCases">
            <fieldset>
                <FieldTitle title="Number of cases"></FieldTitle>
                <FastField
                    label="Number of cases"
                    name="numCases"
                    type="number"
                    component={TextField}
                    fullWidth
                />
            </fieldset>
        </Scroll.Element>
    );
}

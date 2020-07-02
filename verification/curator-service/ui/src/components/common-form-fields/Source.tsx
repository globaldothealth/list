import { FastField } from 'formik';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default function Source(): JSX.Element {
    return (
        <Scroll.Element name="source">
            <fieldset>
                <legend>Source</legend>
                <FastField
                    label="Source URL"
                    name="sourceUrl"
                    type="text"
                    required
                    placeholder="https://..."
                    component={TextField}
                    fullWidth
                />
                <RequiredHelperText name={'sourceUrl'}></RequiredHelperText>
            </fieldset>
        </Scroll.Element>
    );
}

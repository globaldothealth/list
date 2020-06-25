import { Field } from 'formik';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default class Notes extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="notes">
                <fieldset>
                    <legend>Notes</legend>
                    <Field
                        label="Notes"
                        name="notes"
                        type="text"
                        multiline={true}
                        component={TextField}
                        fullWidth
                        rows="3"
                    />
                </fieldset>
            </Scroll.Element>
        );
    }
}

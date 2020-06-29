import { Field } from 'formik';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';

export default class Source extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="source">
                <fieldset>
                    <legend>Source</legend>
                    <Field
                        label="Source URL"
                        name="sourceUrl"
                        type="text"
                        placeholder="https://..."
                        component={TextField}
                        fullWidth
                    />
                </fieldset>
            </Scroll.Element>
        );
    }
}

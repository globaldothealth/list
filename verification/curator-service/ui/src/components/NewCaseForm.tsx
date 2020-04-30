import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { Select, TextField } from 'formik-material-ui';

import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import React from "react";

export default function NewCaseForm() {
    return (
        <Formik
            initialValues={{
                sex: '',
                city: '',
                province: '',
                country: '',
                confirmed: '',
                url: '',
            }}
            onSubmit={(values, { setSubmitting }) => {
                setTimeout(() => {
                    console.log(JSON.stringify(values, null, 2));
                    setSubmitting(false);
                }, 400);
            }}
        >
            {({ submitForm, isSubmitting }) => (
                <Form>
                    <fieldset>
                        <legend>Demographics</legend>
                        <FormControl>
                            <InputLabel htmlFor="sex">Sex</InputLabel>
                            <Field as="select" name="sex" type="text" component={Select}>
                                <MenuItem value={''}></MenuItem>
                                <MenuItem value={'female'}>female</MenuItem>
                                <MenuItem value={'male'}>male</MenuItem>
                            </Field>
                        </FormControl>
                    </fieldset>
                    <fieldset>
                        <legend>Location</legend>
                        <Field label="City" name="city" type="text" component={TextField} />
                        <Field label="Province" name="province" type="text" component={TextField} />
                        <Field label="Country" name="country" type="text" component={TextField} />
                    </fieldset>
                    <fieldset>
                        <legend>Timeline</legend>
                        <InputLabel htmlFor="confirmed">Date confirmed</InputLabel>
                        <Field name="confirmed" type="date" />
                    </fieldset>
                    <fieldset>
                        <legend>Source</legend>
                        <Field label="URL" name="url" type="text" placeholder="https://..." component={TextField} />
                    </fieldset>
                    {isSubmitting && <LinearProgress />}
                    <br />
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        onClick={submitForm}
                    >
                        Submit case
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
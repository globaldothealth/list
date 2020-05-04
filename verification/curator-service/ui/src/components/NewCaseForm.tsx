import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import React, { useState } from "react";
import { Select, TextField } from 'formik-material-ui';

import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import axios from 'axios';

export default function NewCaseForm() {
    const [errorMessage, setErrorMessage] = useState('');
    return (
        <Formik
            initialValues={{
                sex: '',
                city: '',
                province: '',
                country: '',
                confirmed: '',
                url: '',
                outcome: 'Pending',
            }}
            onSubmit={async (values, errors) => {
                try {
                    await axios.post(
                        (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases',
                        {
                            demographics: {
                                sex: values.sex,
                            },
                            location: {
                                administrativeAreaLevel2: values.city,
                                administrativeAreaLevel1: values.province,
                                country: values.country,
                            },
                            importedCase: {
                                outcome: values.outcome,
                            },
                            events: {
                                name: 'confirmed',
                                dateRange: {
                                    start: values.confirmed,
                                },
                            },
                            source: {
                                url: values.url,
                            },
                            revisionMetadata: {
                                id: 0,
                                moderator: "TODO",
                                date: "",
                            },
                        });
                    setErrorMessage('');
                } catch (e) {
                    if (e.response) {
                        setErrorMessage(e.response.data);
                    } else if (e.request) {
                        setErrorMessage(e.request);
                    } else {
                        setErrorMessage(e.message);
                    }
                }
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
                                <MenuItem value={'Female'}>Female</MenuItem>
                                <MenuItem value={'Male'}>Male</MenuItem>
                            </Field>
                        </FormControl>
                    </fieldset>
                    <fieldset>
                        <legend>Outcome</legend>
                        <FormControl>
                            <InputLabel htmlFor="outcome">Outcome</InputLabel>
                            <Field as="select" name="outcome" type="text" component={Select}>
                                <MenuItem value={'Pending'}>Pending</MenuItem>
                                <MenuItem value={'Recovered'}>Recovered</MenuItem>
                                <MenuItem value={'Death'}>Death</MenuItem>
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
                    {errorMessage &&
                        <h3> {errorMessage} </h3>}
                </Form>
            )}
        </Formik>
    );
}
import * as Yup from 'yup';

import { Button, Paper, Typography, makeStyles } from '@material-ui/core';
import { FastField, Form, Formik } from 'formik';

import AppModal from './AppModal';
import FieldTitle from './common-form-fields/FieldTitle';
import MuiAlert from '@material-ui/lab/Alert';
import React from 'react';
import { SelectField } from './common-form-fields/FormikFields';
import { TextField } from 'formik-material-ui';
import User from './User';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

enum Format {
    Csv = 'CSV',
    Json = 'JSON',
}

const useStyles = makeStyles(() => ({
    headerBlurb: {
        maxWidth: '70%',
        paddingBottom: '3em',
        paddingTop: '1em',
    },
    headerText: {
        marginTop: '2em',
    },
    fieldTitle: {
        paddingBottom: '1em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        paddingLeft: '3em',
        paddingRight: '4em',
    },
    formSection: {
        paddingBottom: '2em',
    },
    allFormSections: {
        marginBottom: '2em',
        maxWidth: '60%',
        paddingLeft: '2em',
        paddingRight: '1em',
        paddingTop: '0.5em',
    },
    statusMessage: {
        marginTop: '2em',
        maxWidth: '80%',
    },
    uploadBar: {
        alignItems: 'center',
        display: 'flex',
        height: '4em',
        marginTop: 'auto',
    },
    cancelButton: {
        marginLeft: '1em',
    },
}));

interface Props {
    user: User;
    onModalClose: () => void;
}

export interface AutomatedSourceFormValues {
    url: string;
    name: string;
    format: string;
}

const AutomatedSourceFormSchema = Yup.object().shape({
    url: Yup.string().required('Required'),
    name: Yup.string().required('Required'),
    format: Yup.string().required('Required'),
});

export default function AutomatedSourceForm(props: Props): JSX.Element {
    const classes = useStyles();
    const history = useHistory();
    const [errorMessage, setErrorMessage] = React.useState('');

    const createSource = async (
        values: AutomatedSourceFormValues,
    ): Promise<void> => {
        const newSource = {
            name: values.name,
            origin: { url: values.url },
            format: values.format,
        };
        try {
            await axios.post('/api/sources', newSource);
            setErrorMessage('');
        } catch (e) {
            setErrorMessage(e.response?.data || e.toString());
            return;
        }
        // Navigate to sources after successful submit
        history.push({
            pathname: '/sources',
        });
    };

    return (
        <AppModal
            title="New automated data source"
            onModalClose={props.onModalClose}
        >
            <Formik
                validationSchema={AutomatedSourceFormSchema}
                validateOnChange={false}
                initialValues={{ url: '', name: '', format: '' }}
                onSubmit={async (values): Promise<void> => {
                    await createSource(values);
                }}
            >
                {({ isSubmitting, submitForm }): JSX.Element => (
                    <div className={classes.form}>
                        <div className={classes.headerText}>
                            <Typography data-testid="header-title" variant="h5">
                                Provide details about the automated data source
                            </Typography>
                            <Typography
                                className={classes.headerBlurb}
                                data-testid="header-blurb"
                                variant="body2"
                            >
                                Add new cases through automated ingestion from a
                                data source. G.h List will check for updates
                                every 15 minutes from this new source.
                            </Typography>
                        </div>
                        <Form>
                            <Paper className={classes.allFormSections}>
                                <div className={classes.fieldTitle}>
                                    <FieldTitle title="Data Source" />
                                </div>
                                <div className={classes.formSection}>
                                    <FastField
                                        helperText="Required"
                                        label="Data Source URL"
                                        name="url"
                                        type="text"
                                        data-testid="url"
                                        component={TextField}
                                        fullWidth
                                    />
                                </div>
                                <div className={classes.formSection}>
                                    <FastField
                                        helperText="Required"
                                        label="Data Source Name"
                                        name="name"
                                        type="text"
                                        data-testid="name"
                                        component={TextField}
                                        fullWidth
                                    />
                                </div>
                                <div className={classes.formSection}>
                                    <SelectField
                                        name="format"
                                        label="Data Source Format"
                                        values={Object.values(Format)}
                                        required
                                    />
                                </div>
                            </Paper>
                        </Form>
                        {errorMessage && (
                            <MuiAlert
                                className={classes.statusMessage}
                                elevation={6}
                                variant="filled"
                                severity="error"
                            >
                                {errorMessage}
                            </MuiAlert>
                        )}
                        <div className={classes.uploadBar}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={isSubmitting}
                                onClick={submitForm}
                            >
                                Create source
                            </Button>
                            <Button
                                className={classes.cancelButton}
                                color="primary"
                                disabled={isSubmitting}
                                onClick={props.onModalClose}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </Formik>
        </AppModal>
    );
}

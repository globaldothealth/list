import * as Yup from 'yup';

import { Button, Typography, makeStyles } from '@material-ui/core';
import { FastField, Form, Formik } from 'formik';

import AppModal from './AppModal';
import FieldTitle from './common-form-fields/FieldTitle';
import React from 'react';
import { RequiredHelperText } from './common-form-fields/FormikFields';
import { TextField } from 'formik-material-ui';
import User from './User';

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
    uploadFeedback: {
        paddingBottom: '4em',
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
    progressIndicator: {
        alignItems: 'center',
        display: 'flex',
    },
    progressText: {
        marginLeft: '1em',
    },
}));

interface Props {
    user: User;
    onModalClose: () => void;
}

export interface AutomatedSourceFormValues {
    url: string | null;
    name: string | null;
}

const AutomatedSourceFormSchema = Yup.object().shape({
    url: Yup.string().nullable().required('Required'),
    name: Yup.string().nullable().required('Required'),
});

export default function AutomatedSourceForm(props: Props): JSX.Element {
    const classes = useStyles();
    const createSource = async (
        values: AutomatedSourceFormValues,
    ): Promise<void> => {
        alert(JSON.stringify(values));
        return;
    };

    return (
        <AppModal
            title="New automated data source"
            onModalClose={props.onModalClose}
        >
            <Formik
                validationSchema={AutomatedSourceFormSchema}
                validateOnChange={false}
                initialValues={{ url: null, name: null }}
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
                                every 15 minutes from this new source. After you
                                create this source follow these instructions to
                                set up automation.
                            </Typography>
                        </div>
                        <Form>
                            <fieldset className={classes.allFormSections}>
                                <div className={classes.fieldTitle}>
                                    <FieldTitle title="Data Source" />
                                </div>
                                <div className={classes.formSection}>
                                    <FastField
                                        label="Data Source URL"
                                        name="url"
                                        type="text"
                                        data-testid="url"
                                        component={TextField}
                                        fullWidth
                                    />
                                    <RequiredHelperText name="url" />
                                </div>
                                <div className={classes.formSection}>
                                    <FastField
                                        label="Data Source Name"
                                        name="name"
                                        type="text"
                                        data-testid="name"
                                        component={TextField}
                                        fullWidth
                                    />
                                    <RequiredHelperText name="name" />
                                </div>
                            </fieldset>
                        </Form>
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

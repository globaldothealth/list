import * as Yup from 'yup';

import { Button, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Source, { CaseReferenceForm } from './common-form-fields/Source';

import AppModal from './AppModal';
import { DateField } from './common-form-fields/FormikFields';
import MuiAlert from '@material-ui/lab/Alert';
import { Paper } from '@material-ui/core';
import React from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';

interface RetrievalResult {
    bucket: string;
    key: string;
    upload_id: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useStyles = makeStyles(() => ({
    headerBlurb: {
        maxWidth: '70%',
        paddingBottom: '3em',
        paddingTop: '1em',
    },
    headerText: {
        marginTop: '2em',
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
        paddingBottom: '0.5em',
        paddingLeft: '1em',
        paddingRight: '1em',
        paddingTop: '0.5em',
    },
    statusMessage: {
        marginTop: '2em',
        maxWidth: '80%',
    },
    buttonBar: {
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

export interface AutomatedBackfillValues {
    caseReference?: CaseReferenceForm;
    startDate: string | null;
    endDate: string | null;
}

const AutomatedBackfillSchema = Yup.object().shape({
    caseReference: Yup.object().shape({
        sourceId: Yup.string().required('Required'),
    }),
    startDate: Yup.string().nullable().required('Required'),
    endDate: Yup.string().nullable().required('Required'),
});

export default function AutomatedBackfill(props: Props): JSX.Element {
    const classes = useStyles();
    const [errorMessage, setErrorMessage] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');

    const triggerBackfill = async (
        values: AutomatedBackfillValues,
    ): Promise<void> => {
        try {
            const response = await axios.post<RetrievalResult>(
                `/api/sources/${values.caseReference?.sourceId}/retrieve
                ?parse_start_date=${values.startDate}
                &parse_end_date=${values.endDate}`,
            );
            setErrorMessage('');
            setSuccessMessage(`Created upload ${response.data.upload_id}.`);
        } catch (e) {
            setSuccessMessage('');
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
    };

    return (
        <AppModal
            title="New automated source backfill"
            onModalClose={props.onModalClose}
        >
            <Formik
                validationSchema={AutomatedBackfillSchema}
                validateOnChange={false}
                initialValues={{
                    caseReference: undefined,
                    startDate: null,
                    endDate: null,
                }}
                onSubmit={async (values): Promise<void> => {
                    await triggerBackfill(values);
                }}
            >
                {({ isSubmitting, submitForm }): JSX.Element => (
                    <div className={classes.form}>
                        <div className={classes.headerText}>
                            <Typography data-testid="header-title" variant="h5">
                                Backfill historical data
                            </Typography>
                            <Typography
                                className={classes.headerBlurb}
                                data-testid="header-blurb"
                                variant="body2"
                            >
                                Automatically ingest cases for a configured
                                source over a specified date range.
                            </Typography>
                        </div>
                        <Form>
                            <Paper className={classes.allFormSections}>
                                <div className={classes.formSection}>
                                    <Source disableFreeSolo={true} />
                                </div>
                                <DateField
                                    name="startDate"
                                    label="First date to backfill"
                                    required
                                ></DateField>
                                <DateField
                                    name="endDate"
                                    label="Last date to backfill"
                                    required
                                ></DateField>
                            </Paper>
                        </Form>
                        {successMessage && (
                            <MuiAlert
                                className={classes.statusMessage}
                                elevation={6}
                                variant="filled"
                                severity="success"
                            >
                                {successMessage}
                            </MuiAlert>
                        )}
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
                        <div className={classes.buttonBar}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={isSubmitting}
                                onClick={submitForm}
                            >
                                Backfill source
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

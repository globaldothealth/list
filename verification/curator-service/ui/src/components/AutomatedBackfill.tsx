import React from 'react';
import * as Yup from 'yup';

import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import Source, { CaseReferenceForm } from './common-form-fields/Source';

import AppModal from './AppModal';
import { DateField } from './common-form-fields/FormikFields';
import MuiAlert from '@mui/material/Alert';
import { Paper } from '@mui/material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import { useInterval } from '../hooks/useInterval';

/**
 * The amount of time allowed before timing out a backfill.
 *
 * Parsing functions, on AWS Lambda, have a 15 minute limit. It's possible for
 * retrieval to take a few minutes as well, so we allot five additional minutes
 * for that, too.
 *
 * This is 20 minutes, times 60 seconds per minute, to milliseconds.
 */
const _BACKFILL_TIME_LIMIT_MS = 20 * 60 * 1000;

interface RetrievalResult {
    bucket: string;
    key: string;
    upload_id: string;
}

const StyledForm = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingLeft: '3em',
    paddingRight: '4em',
}));

const StatusMessage = styled(MuiAlert)(() => ({
    marginTop: '2em',
    maxWidth: '60%',
    whiteSpace: 'pre-line',
}));

const ProgressText = styled('span')(() => ({
    marginLeft: '1em',
}));

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    numError?: number;
    error?: string;
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
}

interface SourceResponse {
    uploads: Upload[];
}

interface Props {
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
    const [errorMessage, setErrorMessage] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');
    const [sourceId, setSourceId] = React.useState('');
    const [uploadId, setUploadId] = React.useState('');
    const [uploadStart, setUploadStart] = React.useState(0);
    const [uploadStatus, setUploadStatus] = React.useState('');

    useInterval(async () => {
        if (uploadStatus === 'IN_PROGRESS') {
            const response = await axios.get<SourceResponse>(
                `/api/sources/${sourceId}`,
            );
            const upload = response.data.uploads.find(
                (u) => u._id === uploadId,
            );
            if (!upload) {
                setUploadStatus('');
                setErrorMessage(
                    'Internal error saving upload. Please try again after a few minutes.',
                );
            } else if (upload.status === 'ERROR') {
                setUploadStatus(upload.status);
                setErrorMessage(
                    `Upload ${uploadId} failed with error: ${upload.summary.error}`,
                );
            } else if (upload.status === 'SUCCESS') {
                setUploadStatus(upload.status);
                const baseMessage = `Upload ${uploadId} completed successfully.`;
                const createMessage = upload.summary?.numCreated
                    ? ` Created ${upload.summary.numCreated} case(s).`
                    : '';
                const updateMessage = upload.summary?.numUpdated
                    ? ` Updated ${upload.summary.numUpdated} case(s).`
                    : '';
                const errorMessage = upload.summary?.numError
                    ? `Validation error in ${upload.summary.numError} case(s).`
                    : '';
                setSuccessMessage(
                    baseMessage.concat(
                        createMessage,
                        updateMessage,
                        errorMessage,
                    ),
                );
            } else if (uploadStart && outOfTime(uploadStart)) {
                setUploadStatus('ERROR');
                setErrorMessage(
                    `Upload ${uploadId} failed with timeout.
                     This typically means that the parsing function wasn't able to ingest all cases in the provided range within the function time limit.
                     Please search the line list by the above upload ID to find what dates were covered, and for subsequent backfills, try running over a date range with fewer cases.`,
                );
                await axios.put(
                    `/api/sources/${sourceId}/uploads/${uploadId}`,
                    {
                        status: 'ERROR',
                        summary: {
                            error: 'TIMEOUT',
                        },
                    },
                );
            }
        }
    }, 10000);

    /**
     * Determines whether or not backfill has exceeded the configured time
     * limit.
     *
     * @param startTime - Time at which backfill began.
     */
    const outOfTime = (startTime: number): boolean => {
        return Date.now() - startTime > _BACKFILL_TIME_LIMIT_MS;
    };

    /**
     * Convert the supplied date to a local YYYY-MM-DD format.
     *
     * Our date picker component returns a timezoned datetime, but for the
     * purposes of backfill, users really just want to select a timezone-less
     * date, as opposed to an instant in time.
     *
     * Converting to this format allows a proper range comparison for retrieval
     * and parsing.
     */
    const isoDateString = (date: Date): string => {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal = date.getTime() - offsetMs;
        return new Date(msLocal).toISOString().split('T')[0];
    };

    const triggerBackfill = async (
        values: AutomatedBackfillValues,
    ): Promise<void> => {
        try {
            setErrorMessage('');
            setSuccessMessage('');
            // This will never happen, because of Yup validation.
            if (
                values.caseReference === undefined ||
                values.startDate === null ||
                values.endDate === null
            ) {
                setErrorMessage('Please enter valid source and dates');
                return;
            }
            setSourceId(values.caseReference.sourceId);
            const utcStartDateString = isoDateString(
                new Date(values.startDate),
            );
            const utcEndDateString = isoDateString(new Date(values.endDate));
            const baseUri = `/api/sources/${values.caseReference.sourceId}/retrieve`;
            const fullUri = `${baseUri}?parse_start_date=${utcStartDateString}&parse_end_date=${utcEndDateString}`;
            const response = await axios.post<RetrievalResult>(
                encodeURI(fullUri),
            );
            setUploadStart(Date.now());
            setUploadStatus('IN_PROGRESS');
            setUploadId(response.data.upload_id);
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
                onSubmit={(values): Promise<void> => {
                    return triggerBackfill(values);
                }}
            >
                {({ isSubmitting, submitForm }): JSX.Element => (
                    <StyledForm>
                        <Box sx={{ marginTop: '2em' }}>
                            <Typography data-testid="header-title" variant="h5">
                                Backfill historical data
                            </Typography>
                            <Typography
                                sx={{
                                    maxWidth: '70%',
                                    paddingBottom: '3em',
                                    paddingTop: '1em',
                                }}
                                data-testid="header-blurb"
                                variant="body2"
                            >
                                Automatically ingest cases for a configured
                                source over a specified date range.
                            </Typography>
                        </Box>
                        <Form>
                            <Paper
                                sx={{
                                    marginBottom: '2em',
                                    maxWidth: '60%',
                                    paddingBottom: '0.5em',
                                    paddingLeft: '1em',
                                    paddingRight: '1em',
                                    paddingTop: '0.5em',
                                }}
                            >
                                <Box sx={{ paddingBottom: '2em' }}>
                                    <Source
                                        freeSolo={false}
                                        sourcesWithStableIdentifiers
                                    />
                                </Box>

                                <DateField
                                    name="startDate"
                                    label="First date to backfill (inclusive)"
                                    required
                                ></DateField>
                                <DateField
                                    name="endDate"
                                    label="Last date to backfill (inclusive)"
                                    required
                                ></DateField>
                            </Paper>
                        </Form>
                        {successMessage && (
                            <StatusMessage
                                elevation={6}
                                variant="filled"
                                severity="success"
                            >
                                {successMessage}
                            </StatusMessage>
                        )}
                        {errorMessage && (
                            <StatusMessage
                                elevation={6}
                                variant="filled"
                                severity="error"
                            >
                                {errorMessage}
                            </StatusMessage>
                        )}
                        {(isSubmitting || uploadStatus === 'IN_PROGRESS') && (
                            <StatusMessage
                                data-testid="progressDetails"
                                elevation={6}
                                severity="info"
                                variant="filled"
                            >
                                <strong>Backfill in progress.</strong>
                                <br />
                                This can take up to 15 minutes. Do not run
                                another backfill until this completes.
                                <br />
                                This page will automatically update with upload
                                details.
                                {uploadId && (
                                    <>
                                        <br />
                                        Upload ID: {uploadId}.
                                    </>
                                )}
                            </StatusMessage>
                        )}
                        <Box
                            sx={{
                                alignItems: 'center',
                                display: 'flex',
                                height: '4em',
                                marginTop: 'auto',
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={
                                    isSubmitting ||
                                    uploadStatus === 'IN_PROGRESS'
                                }
                                onClick={submitForm}
                            >
                                Backfill source
                            </Button>
                            <Button
                                sx={{ marginLeft: '1em' }}
                                color="primary"
                                disabled={
                                    isSubmitting ||
                                    uploadStatus === 'IN_PROGRESS'
                                }
                                onClick={props.onModalClose}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <span style={{ flexGrow: 1 }}></span>
                            {(isSubmitting ||
                                uploadStatus === 'IN_PROGRESS') && (
                                <Box
                                    sx={{
                                        alignItems: 'center',
                                        display: 'flex',
                                    }}
                                >
                                    <CircularProgress data-testid="progress" />
                                    <ProgressText>
                                        <strong>Processing backfill.</strong>
                                    </ProgressText>
                                </Box>
                            )}
                        </Box>
                    </StyledForm>
                )}
            </Formik>
        </AppModal>
    );
}

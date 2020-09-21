import * as Yup from 'yup';

import {
    Button,
    CircularProgress,
    Typography,
    withStyles,
} from '@material-ui/core';
import {
    Case,
    CaseReference,
    Event,
    PreexistingConditions,
    Symptoms,
    VerificationStatus,
} from './Case';
import { Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Source, { submitSource } from './common-form-fields/Source';
import { Theme, createStyles } from '@material-ui/core/styles';

import Alert from '@material-ui/lab/Alert';
import AppModal from './AppModal';
import BulkCaseFormValues from './bulk-case-form-fields/BulkCaseFormValues';
import CaseValidationError from './bulk-case-form-fields/CaseValidationError';
import FileUpload from './bulk-case-form-fields/FileUpload';
import { Paper } from '@material-ui/core';
import React from 'react';
import ValidationErrorList from './bulk-case-form-fields/ValidationErrorList';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
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
            paddingLeft: '1em',
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
    });

interface BulkCaseFormProps
    extends RouteComponentProps,
        WithStyles<typeof styles> {
    user: User;
    onModalClose: () => void;
}

interface BulkCaseFormState {
    errorMessage: string;
    errors: CaseValidationError[];
}

interface AgeRange {
    start?: number;
    end?: number;
}

/**
 * Flattened case representation.
 *
 * Composed of fields present in the standardized manual upload CSV. Comments
 * denote sections of the canonical case object to which fields correspond,
 * where applicable.
 */
interface RawParsedCase {
    // Interface index
    [key: string]: string | number | boolean | undefined;

    // CaseReference
    // sourceId and sourceUrl are provided elsewhere in the form
    sourceEntryId?: string;

    // Demographics
    gender?: string;
    // Convenience field to provide age range in $start-$end format.
    ageRange?: string;
    ageRangeStart?: number;
    ageRangeEnd?: number;
    ethnicity?: string;
    nationalities?: string; // semicolon delimited list
    occupation?: string;

    // Events
    dateConfirmed: string;
    confirmationMethod?: string;
    hospitalized?: boolean;
    dateHospitalized?: string;
    icuAdmission?: boolean;
    dateIcuAdmission?: string;
    outcome?: string;
    dateOutcome?: string;
    dateSymptomOnset?: string;

    // Preexisting conditions
    hasPreexistingConditions?: boolean;
    preexistingConditions?: string; // semicolon delimited list

    // Symptoms
    symptoms?: string; // semicolon delimited list
    symptomStatus?: string;

    // Location
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;

    // Bulk upload specific data
    caseCount?: number;
}

interface BatchUpsertError {
    index: number;
    message: string;
}

interface BatchUpsertResponse {
    phase: string;
    numCreated: number;
    numUpdated: number;
    errors: BatchUpsertError[];
}

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    error?: string;
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
}

// See description below for usage. This is a mapped partial type that
// reproduces the fields of <T>, including for nested fields. The non-
// recursive variant of this is easier to understand, and is explained here:
//
//   https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types
//
// By changing the field type from T[P] to RecursivePartial<T[P]>, we can make
// nested fields optional; which is important for this specific abstraction.
type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

// Re-use the case model defined in this dir, but with all optional fields.
// Existing components rely on pseudo-optional semantics for most fields in the
// case object (e.g., relying on axios only to populate the fields indicated by
// the case API), but we can't cleanly do that here, since we're directly both
// populating and using the values in the object.
//
// TODO: Consider defining truly optional fields as optional in Case.tsx.
type CompleteParsedCase = RecursivePartial<Case> & { caseCount?: number };

const BulkFormSchema = Yup.object().shape({
    caseReference: Yup.object().shape({
        sourceUrl: Yup.string().required('Required'),
        sourceName: Yup.string().required('Required'),
    }),
    file: Yup.mixed().required('Please upload a file'),
});

class BulkCaseForm extends React.Component<
    BulkCaseFormProps,
    BulkCaseFormState
> {
    constructor(props: BulkCaseFormProps) {
        super(props);
        this.state = {
            errorMessage: '',
            errors: [],
        };
    }

    // TODO: Standardize event naming/constructions between case forms.
    createEvents(c: RawParsedCase): Event[] {
        const events = [];
        // TODO: Add ParsedCase validation.
        if (c.dateConfirmed) {
            events.push({
                name: 'confirmed',
                dateRange: {
                    start: c.dateConfirmed,
                    end: c.dateConfirmed,
                },
                value: c.confirmationMethod,
            });
        }
        if (c.hospitalized === true) {
            events.push({
                name: 'hospitalAdmission',
                dateRange: c.dateHospitalized
                    ? {
                          start: c.dateHospitalized,
                          end: c.dateHospitalized,
                      }
                    : undefined,
                value: 'Yes',
            });
        }
        if (c.icuAdmission === true) {
            events.push({
                name: 'icuAdmission',
                dateRange: c.dateIcuAdmission
                    ? {
                          start: c.dateIcuAdmission,
                          end: c.dateIcuAdmission,
                      }
                    : undefined,
                value: 'Yes',
            });
        }
        if (c.outcome) {
            events.push({
                name: 'outcome',
                dateRange: c.dateOutcome
                    ? {
                          start: c.dateOutcome,
                          end: c.dateOutcome,
                      }
                    : undefined,
                value: c.outcome,
            });
        }
        if (c.dateSymptomOnset) {
            events.push({
                name: 'onsetSymptoms',
                dateRange: {
                    start: c.dateSymptomOnset,
                    end: c.dateSymptomOnset,
                },
            });
        }
        return events;
    }

    /**
     * Defines the acceptable geocoding result types.
     *
     * Currently operates under the assumption that the final geocode should be
     * return only types specified in the uploaded data. Setting this prevents
     * inadvertent increases in resolution: e.g., an non-geocodable county name
     * being interpreted as a street name.
     *
     * TODO: Once county-level geocoding is fixed, consider removing the option
     * to lose resolution, here. For now, we can't require the most precise
     * resolution, because the erroneous county cases will 404.
     */
    createGeoResolutionLimit(c: RawParsedCase): string {
        const types = [];
        if (c.admin3) {
            types.push('Admin3');
        }
        if (c.admin2) {
            types.push('Admin2');
        }
        if (c.admin1) {
            types.push('Admin1');
        }
        types.push('Country');
        return types.join(',');
    }

    createLocationQuery(c: RawParsedCase): string {
        return [c.admin3, c.admin2, c.admin1, c.country]
            .filter((field) => field)
            .join(', ');
    }

    createAgeRange(c: RawParsedCase): AgeRange {
        let ageRangeStart = c.ageRangeStart;
        let ageRangeEnd = c.ageRangeEnd;
        if (c.ageRange?.match(/^\d*-\d*$/)) {
            const startEnd = c.ageRange.split('-');
            ageRangeStart = startEnd[0] ? Number(startEnd[0]) : undefined;
            ageRangeEnd = startEnd[1] ? Number(startEnd[1]) : undefined;
        }
        return { start: ageRangeStart, end: ageRangeEnd };
    }

    createSymptoms(c: RawParsedCase): Symptoms | undefined {
        return c.symptomStatus
            ? {
                  status: c.symptomStatus,
                  values: c.symptoms ? c.symptoms.split(';') : [],
              }
            : undefined;
    }

    createPreexistingConditions(
        c: RawParsedCase,
    ): PreexistingConditions | undefined {
        return c.hasPreexistingConditions !== undefined
            ? {
                  hasPreexistingConditions: c.hasPreexistingConditions,
                  values: c.preexistingConditions
                      ? c.preexistingConditions.split(';')
                      : [],
              }
            : undefined;
    }

    /**
     * Create an API-ready case object from parsed case data.
     *
     * TODO: Put the Raw->CompleteParsedCase conversion logic in a separate
     * class, and unit test the API. Right now it's just verified via a single
     * Cypress case.
     */
    createCaseObject(
        c: RawParsedCase,
        events: Event[],
        geoResolutionLimit: string,
        locationQuery: string,
        ageRange: AgeRange,
        caseReference: CaseReference,
        uploadId: string,
        symptoms?: Symptoms,
        preexistingConditions?: PreexistingConditions,
    ): CompleteParsedCase {
        return {
            caseReference: {
                sourceId: caseReference.sourceId,
                sourceEntryId: c.sourceEntryId,
                sourceUrl: caseReference.sourceUrl,
                uploadIds: [uploadId],
                verificationStatus: VerificationStatus.Verified,
            },
            demographics: {
                gender: c.gender,
                ageRange: ageRange,
                ethnicity: c.ethnicity,
                nationalities: c.nationalities?.split(';'),
                occupation: c.occupation,
            },
            location: {
                country: c.country,
                administrativeAreaLevel1: c.admin1,
                administrativeAreaLevel2: c.admin2,
                administrativeAreaLevel3: c.admin3,
                query: locationQuery,
                geometry:
                    c.latitude && c.longitude
                        ? {
                              latitude: c.latitude,
                              longitude: c.longitude,
                          }
                        : undefined,
                name: c.locationName,
                limitToResolution: geoResolutionLimit,
            },
            events: events,
            preexistingConditions: preexistingConditions,
            symptoms: symptoms,
            caseCount: c.caseCount,
        };
    }

    async batchUpsertCases(
        cases: CompleteParsedCase[],
    ): Promise<BatchUpsertResponse> {
        const casesToSend = cases.flatMap((c) =>
            Array.from({ length: c.caseCount || 1 }, () => c),
        );
        // TODO: Split and send smaller batches.
        const response = await axios.post<BatchUpsertResponse>(
            '/api/cases/batchUpsert',
            {
                cases: casesToSend,
            },
            { maxContentLength: Infinity },
        );
        return response.data;
    }

    async createUpload(caseReference: CaseReference): Promise<string> {
        const response = await axios.post<Upload>(
            `/api/sources/${caseReference.sourceId}/uploads`,
            {
                status: 'IN_PROGRESS',
                summary: {},
            },
        );
        return response.data._id;
    }

    async finalizeUpload(
        sourceId: string,
        uploadId: string,
        status: string,
        summary: UploadSummary,
    ): Promise<void> {
        await axios.put(`/api/sources/${sourceId}/uploads/${uploadId}`, {
            status: status,
            summary: summary,
        });
    }

    async uploadData(
        results: ParseResult<RawParsedCase>,
        caseReference: CaseReference,
        filename: string,
    ): Promise<void> {
        const uploadId = await this.createUpload(caseReference);
        const cases = results.data.map((c) => {
            // papaparse uses null to fill values that are empty in the CSV.
            // I'm not clear how it does so -- since our types aren't union
            // null -- but it does.
            // Here, replace these with undefined so that they aren't populated
            // in the axios request object.
            Object.keys(c).forEach(
                (field) =>
                    (c[field] = c[field] === null ? undefined : c[field]),
            );
            const geoResolutionLimit = this.createGeoResolutionLimit(c);
            const locationQuery = this.createLocationQuery(c);
            const events = this.createEvents(c);
            const ageRange = this.createAgeRange(c);
            const symptoms = this.createSymptoms(c);
            const preexistingConditions = this.createPreexistingConditions(c);
            return this.createCaseObject(
                c,
                events,
                geoResolutionLimit,
                locationQuery,
                ageRange,
                caseReference,
                uploadId,
                symptoms,
                preexistingConditions,
            );
        });

        let upsertResponse: BatchUpsertResponse;
        try {
            upsertResponse = await this.batchUpsertCases(cases);
        } catch (e) {
            this.setState({
                errorMessage: `System error during upload: ${JSON.stringify(
                    e,
                )}`,
            });
            await this.finalizeUpload(
                caseReference.sourceId,
                uploadId,
                'ERROR',
                { error: 'DATA_UPLOAD_ERROR' },
            );
            return;
        }
        const validationErrors = upsertResponse.errors.map(
            (e) => new CaseValidationError(e.index + 1, e.message),
        );
        this.setState({ errors: validationErrors });
        if (validationErrors.length > 0) {
            this.setState({
                errors: validationErrors,
                errorMessage: '',
            });
            await this.finalizeUpload(
                caseReference.sourceId,
                uploadId,
                'ERROR',
                { error: 'VALIDATION_ERROR' },
            );
            return;
        }
        await this.finalizeUpload(caseReference.sourceId, uploadId, 'SUCCESS', {
            numCreated: upsertResponse.numCreated,
            numUpdated: upsertResponse.numUpdated,
        });
        const createdMessage =
            upsertResponse.numCreated === 0
                ? ''
                : upsertResponse.numCreated === 1
                ? '1 new case added. '
                : `${upsertResponse.numCreated} new cases added. `;
        const updatedMessage =
            upsertResponse.numUpdated === 0
                ? ''
                : upsertResponse.numUpdated === 1
                ? '1 case updated. '
                : `${upsertResponse.numUpdated} cases updated. `;
        this.props.history.push({
            pathname: '/cases',
            state: {
                bulkMessage: `${filename} uploaded. ${createdMessage} ${updatedMessage}`,
                searchQuery: `uploadid:${uploadId}`,
            },
        });
    }

    async submitCases(values: BulkCaseFormValues): Promise<unknown> {
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
                    format: 'CSV',
                });
                values.caseReference.sourceId = newCaseReference.sourceId;
            } catch (e) {
                this.setState({
                    errorMessage: `System error during source creation: ${JSON.stringify(
                        e,
                    )}`,
                });
                return;
            }
        }
        if (values.file && values.caseReference) {
            const parsePromise = (
                file: File,
                caseReference: CaseReference,
            ): Promise<unknown> => {
                return new Promise((resolve) => {
                    const papaparseOptions: ParseConfig<RawParsedCase> = {
                        complete: async (results) => {
                            await this.uploadData(
                                results,
                                caseReference,
                                file.name,
                            );
                            resolve();
                        },
                        dynamicTyping: true,
                        header: true,
                        skipEmptyLines: true,
                    };
                    Papa.parse(file, papaparseOptions);
                });
            };
            return parsePromise(values.file, values.caseReference);
        }
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <AppModal
                title="New bulk upload"
                onModalClose={this.props.onModalClose}
            >
                <Formik
                    validationSchema={BulkFormSchema}
                    validateOnChange={false}
                    initialValues={{ file: null, caseReference: undefined }}
                    onSubmit={async (values): Promise<void> => {
                        await this.submitCases(values);
                    }}
                >
                    {({ isSubmitting, submitForm }): JSX.Element => (
                        <div className={classes.form}>
                            <div className={classes.headerText}>
                                <Typography
                                    data-testid="header-title"
                                    variant="h5"
                                >
                                    Upload bulk data
                                </Typography>
                                <Typography
                                    className={classes.headerBlurb}
                                    data-testid="header-blurb"
                                    variant="body2"
                                >
                                    Add new cases or make changes to existing
                                    ones by uploading a CSV file. The CSV needs
                                    to follow the case template format for
                                    successful entries.{' '}
                                    {/* TODO: Host the final CSV template. */}
                                    <a
                                        href="https://docs.google.com/spreadsheets/d/1J-C7dq1rNNV8KdE1IZ-hUR6lsz7AdlvQhx6DWp36bjE/export?format=csv"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        Download case template (.csv)
                                    </a>
                                </Typography>
                            </div>
                            <Form>
                                <Paper className={classes.allFormSections}>
                                    <div className={classes.formSection}>
                                        <Source />
                                    </div>
                                    <div className={classes.formSection}>
                                        <FileUpload></FileUpload>
                                    </div>
                                </Paper>
                                {/* TODO: Host the final instructions doc. */}
                                <a
                                    href="https://github.com/globaldothealth/list/tree/main/verification/curator-service/ui#bulk-upload-process"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Need help? Detailed instructions here
                                </a>
                                <div className={classes.uploadFeedback}>
                                    {this.state.errors.length > 0 && (
                                        <ValidationErrorList
                                            errors={this.state.errors}
                                            maxDisplayErrors={10}
                                        />
                                    )}
                                    {this.state.errorMessage && (
                                        <Alert
                                            className={classes.statusMessage}
                                            severity="error"
                                        >
                                            {this.state.errorMessage}
                                        </Alert>
                                    )}
                                </div>
                            </Form>
                            <div className={classes.uploadBar}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    data-testid="submit"
                                    disabled={isSubmitting}
                                    onClick={submitForm}
                                >
                                    Upload Cases
                                </Button>
                                <Button
                                    className={classes.cancelButton}
                                    color="primary"
                                    disabled={isSubmitting}
                                    onClick={this.props.onModalClose}
                                    variant="outlined"
                                >
                                    Cancel
                                </Button>
                                <span style={{ flexGrow: 1 }}></span>
                                {isSubmitting && (
                                    <div className={classes.progressIndicator}>
                                        <CircularProgress data-testid="progress" />
                                        <span className={classes.progressText}>
                                            <strong>Uploading cases</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Formik>
            </AppModal>
        );
    }
}

export default withRouter(withStyles(styles)(BulkCaseForm));

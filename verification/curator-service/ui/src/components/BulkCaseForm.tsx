import * as Yup from 'yup';

import { Button, CircularProgress, withStyles } from '@material-ui/core';
import { Case, CaseReference, Event } from './Case';
import { Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import axios, { AxiosResponse } from 'axios';
import Source, { submitSource } from './common-form-fields/Source';

import Alert from '@material-ui/lab/Alert';
import AppModal from './AppModal';
import CaseValidationError from './bulk-case-form-fields/CaseValidationError';
import FileUpload from './bulk-case-form-fields/FileUpload';
import React from 'react';
import ValidationErrorList from './bulk-case-form-fields/ValidationErrorList';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = () =>
    createStyles({
        container: {
            display: 'flex',
        },
        form: {
            paddingLeft: '2em',
        },
        formSection: {
            margin: '2em 0',
        },
        statusMessage: {
            marginTop: '2em',
            maxWidth: '80%',
        },
        uploadButton: {
            marginRight: '2em',
        },
        uploadDiv: {
            display: 'flex',
            alignItems: 'center',
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

interface CaseReferenceForm extends CaseReference {
    sourceName?: string;
}

interface BulkCaseFormValues {
    file: File | null;
    caseReference?: CaseReferenceForm;
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
    ageRangeStart?: number;
    ageRangeEnd?: number;

    // Events
    dateConfirmed: string;
    hospitalized?: boolean;
    dateHospitalized?: string;
    outcome?: string;
    dateOutcome?: string;

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
    createdCaseIds: string[];
    updatedCaseIds: string[];
    errors: BatchUpsertError[];
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
        if (c.outcome) {
            events.push({
                name: 'outcome',
                dateRange: {
                    start: c.dateOutcome,
                    end: c.dateOutcome,
                },
                value: c.outcome,
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

    createCaseObject(
        c: RawParsedCase,
        events: Event[],
        geoResolutionLimit: string,
        locationQuery: string,
        caseReference: CaseReference,
    ): CompleteParsedCase {
        return {
            caseReference: {
                sourceId: caseReference.sourceId,
                sourceEntryId: c.sourceEntryId,
                sourceUrl: caseReference.sourceUrl,
            },
            demographics: {
                gender: c.gender,
                ageRange: {
                    start: c.ageRangeStart,
                    end: c.ageRangeEnd,
                },
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
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: this.props.user.email,
                    date: new Date().toISOString(),
                },
            },
            caseCount: c.caseCount,
        };
    }

    async batchUpsertCases(
        cases: CompleteParsedCase[],
    ): Promise<BatchUpsertResponse> {
        const casesToSend = cases.flatMap((c) =>
            Array.from({ length: c.caseCount || 1 }, () => c),
        );
        const response = await axios.post<BatchUpsertResponse>(
            '/api/cases/batchUpsert',
            {
                cases: casesToSend,
            },
        );
        return response.data;
    }

    async uploadData(
        results: ParseResult<RawParsedCase>,
        caseReference: CaseReference,
        filename: string,
    ): Promise<void> {
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
            return this.createCaseObject(
                c,
                events,
                geoResolutionLimit,
                locationQuery,
                caseReference,
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
            return;
        }
        const createdIds = upsertResponse.createdCaseIds;
        const updatedIds = upsertResponse.updatedCaseIds;
        const createdMessage =
            createdIds.length === 0
                ? ''
                : createdIds.length === 1
                ? '1 new case added. '
                : `${createdIds.length} new cases added. `;
        const updatedMessage =
            updatedIds.length === 0
                ? ''
                : updatedIds.length === 1
                ? '1 case updated. '
                : `${updatedIds.length} cases updated. `;
        this.props.history.push({
            pathname: '/cases',
            state: {
                bulkMessage: `${filename} uploaded. ${createdMessage} ${updatedMessage}`,
                newCaseIds: createdIds,
                editedCaseIds: updatedIds,
            },
        });
    }

    async submitCases(values: BulkCaseFormValues): Promise<unknown> {
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
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
                        <div className={classes.container}>
                            <Form className={classes.form}>
                                <div className={classes.formSection}>
                                    <Source></Source>
                                </div>
                                <div className={classes.formSection}>
                                    <FileUpload></FileUpload>
                                </div>
                                <div className={classes.uploadDiv}>
                                    <Button
                                        className={classes.uploadButton}
                                        variant="contained"
                                        color="primary"
                                        data-testid="submit"
                                        disabled={isSubmitting}
                                        onClick={submitForm}
                                    >
                                        Upload cases
                                    </Button>
                                    {isSubmitting && (
                                        <CircularProgress data-testid="progress" />
                                    )}
                                </div>
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
                            </Form>
                        </div>
                    )}
                </Formik>
            </AppModal>
        );
    }
}

export default withRouter(withStyles(styles)(BulkCaseForm));

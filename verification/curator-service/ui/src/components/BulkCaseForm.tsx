import * as Yup from 'yup';

import { Button, withStyles } from '@material-ui/core';
import { Case, CaseReference, Event } from './Case';
import { Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

import FileUpload from './bulk-case-form-fields/FileUpload';
import React from 'react';
import Source from './common-form-fields/Source';
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
    });

interface BulkCaseFormProps extends WithStyles<typeof styles> {
    user: User;
}

interface BulkCaseFormState {
    statusMessage: string;
}

interface BulkCaseFormValues {
    file: File | null;
    caseReference?: CaseReference;
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
    sex?: string;
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

interface CompleteParsedCase extends Case {
    caseCount?: number;
}

const BulkFormSchema = Yup.object().shape({
    caseReference: Yup.object().required('Required field'),
    file: Yup.mixed().required('Please upload a file'),
});

class BulkCaseForm extends React.Component<
    BulkCaseFormProps,
    BulkCaseFormState
> {
    constructor(props: BulkCaseFormProps) {
        super(props);
        this.state = {
            statusMessage: '',
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
        if (c.hospitalized) {
            events.push({
                name: 'hospitalAdmission',
                dateRange: c.dateHospitalized
                    ? {
                          start: c.dateHospitalized,
                          end: c.dateHospitalized,
                      }
                    : undefined,
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

    createGeoResolution(c: RawParsedCase): string {
        if (c.admin3) {
            return 'Admin3';
        } else if (c.admin2) {
            return 'Admin2';
        } else if (c.admin1) {
            return 'Admin1';
        } else {
            return 'Country';
        }
    }

    createLocationQuery(c: RawParsedCase): string {
        return [c.admin3, c.admin2, c.admin1, c.country]
            .filter((field) => field)
            .join(', ');
    }

    createCaseObject(
        c: RawParsedCase,
        events: Event[],
        geoResolution: string,
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
                sex: c.sex,
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
                geoResolution: geoResolution,
                name: c.locationName,
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

    async upsertCase(c: CompleteParsedCase): Promise<void> {
        return axios.put('/api/cases', c);
    }

    async uploadData(
        results: ParseResult<RawParsedCase>,
        caseReference: CaseReference,
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
            const geoResolution = this.createGeoResolution(c);
            const locationQuery = this.createLocationQuery(c);
            const events = this.createEvents(c);
            return this.createCaseObject(
                c,
                events,
                locationQuery,
                geoResolution,
                caseReference,
            );
        });
        for (const c of cases) {
            try {
                const casesToUpsert = c.caseCount ? c.caseCount : 1;
                for (let i = 0; i < casesToUpsert; i++) {
                    await this.upsertCase(c);
                }
                this.setState({ statusMessage: 'Success!' });
            } catch (e) {
                this.setState({
                    statusMessage: `System error during upload: ${JSON.stringify(
                        e,
                    )}`,
                });
            }
        }
    }

    async submitCases(values: BulkCaseFormValues): Promise<void> {
        if (values.file) {
            const papaparseOptions: ParseConfig<RawParsedCase> = {
                complete: (results) => {
                    // CaseReference is required per form validation.
                    // But, Typescript doesn't know that.
                    if (values.caseReference) {
                        this.uploadData(results, values.caseReference);
                    }
                },
                dynamicTyping: true,
                header: true,
                skipEmptyLines: true,
            };
            Papa.parse(values.file, papaparseOptions);
        }
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Formik
                validationSchema={BulkFormSchema}
                validateOnChange={false}
                initialValues={{ file: null, caseReference: undefined }}
                onSubmit={(values): Promise<void> => this.submitCases(values)}
            >
                {({ isSubmitting, submitForm, values }): JSX.Element => (
                    <div className={classes.container}>
                        <Form className={classes.form}>
                            <div className={classes.formSection}>
                                <Source
                                    initialValue={values.caseReference}
                                ></Source>
                            </div>
                            <div className={classes.formSection}>
                                <FileUpload></FileUpload>
                            </div>
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={isSubmitting}
                                onClick={submitForm}
                            >
                                Upload cases
                            </Button>
                            {this.state.statusMessage && (
                                <h3>{this.state.statusMessage as string}</h3>
                            )}
                        </Form>
                    </div>
                )}
            </Formik>
        );
    }
}

export default withStyles(styles)(BulkCaseForm);

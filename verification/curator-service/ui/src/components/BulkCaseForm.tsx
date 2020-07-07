import { Button, withStyles } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

import { Event } from './Case';
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
    sourceUrl: string;
}

/**
 * Flattened case representation.
 *
 * Composed of fields present in the standardized manual upload CSV. Comments
 * denote sections of the canonical case object to which fields correspond,
 * where applicable.
 */
interface ParsedCase {
    // Interface index
    [key: string]: string | number | boolean | undefined;

    // CaseReference
    sourceId: string;
    sourceEntryId?: string;
    sourceUrl: string;

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
    latitude?: string;
    longitude?: string;
    locationName?: string;

    // Bulk upload specific data
    caseCount?: number;
}

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
    createEvents(c: ParsedCase): Event[] {
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

    createGeoResolution(c: ParsedCase): string {
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

    createLocationQuery(c: ParsedCase): string {
        return [c.admin3, c.admin2, c.admin1, c.country]
            .filter((field) => field)
            .join(', ');
    }

    async upsertCase(
        c: ParsedCase,
        events: Event[],
        geoResolution: string,
        locationQuery: string,
    ): Promise<void> {
        return axios.put('/api/cases', {
            caseReference: {
                sourceId: c.sourceId,
                sourceEntryId: c.sourceEntryId,
                sourceUrl: c.sourceUrl,
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
                admin1: c.admin1,
                admin2: c.admin2,
                admin3: c.admin3,
                query: locationQuery,
                geometry: {
                    latitude: c.latitude,
                    longitude: c.longitude,
                },
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
        });
    }

    async uploadData(results: ParseResult<ParsedCase>): Promise<void> {
        for (const c of results.data) {
            // papaparse uses null to fill values that are empty in the CSV.
            // I'm not clear how it does so -- since our types aren't union
            // null -- but it does.
            // Here, replace these with undefined so that they aren't populated
            // in the axios request object.
            Object.keys(c).forEach(
                (field) =>
                    (c[field] = c[field] === null ? undefined : c[field]),
            );
            try {
                const geoResolution = this.createGeoResolution(c);
                const locationQuery = this.createLocationQuery(c);
                const events = this.createEvents(c);
                const casesToUpsert = c.caseCount ? c.caseCount : 1;
                for (let i = 0; i < casesToUpsert; i++) {
                    await this.upsertCase(
                        c,
                        events,
                        geoResolution,
                        locationQuery,
                    );
                }
                this.setState({ statusMessage: 'Success!' });
            } catch (e) {
                if (e.response) {
                    this.setState({ statusMessage: e.response.data });
                } else if (e.request) {
                    this.setState({ statusMessage: e.request });
                } else {
                    this.setState({ statusMessage: e.message });
                }
            }
        }
    }

    async submitCases(values: BulkCaseFormValues): Promise<void> {
        if (values.file) {
            const papaparseOptions: ParseConfig<ParsedCase> = {
                complete: (results) => {
                    this.uploadData(results);
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
                initialValues={{ file: null, sourceUrl: '' }}
                onSubmit={(values): Promise<void> => this.submitCases(values)}
            >
                {({ isSubmitting, submitForm, values }): JSX.Element => (
                    <div className={classes.container}>
                        <Form className={classes.form}>
                            <div className={classes.formSection}>
                                <Source
                                    initialValue={values.sourceUrl}
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

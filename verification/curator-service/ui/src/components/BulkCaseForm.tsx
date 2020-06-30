import { Button, withStyles } from '@material-ui/core';
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
}

/**
 * Flattened case representation.
 *
 * Composed of fields present in the standardized manual upload CSV. Comments
 * denote sections of the canonical case object to which fields correspond,
 * where applicable.
 */
interface ParsedCase {
    // CaseReference
    sourceId: string;
    sourceEntryId?: string;
    sourceUrl: string;

    // Demographics
    sex?: string;
    ageRangeStart?: Date;
    ageRangeEnd?: Date;

    // Events
    dateConfirmed: Date;

    // Location
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    latitude?: string;
    longitude?: string;
    locationName?: string;
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

    createLocationQuery(c: any): string {
        return [c.admin3, c.admin2, c.admin1, c.country]
            .filter((field) => field)
            .join(', ');
    }

    // Using a generic type for now; will define case record later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async uploadData(results: ParseResult<ParsedCase>): Promise<void> {
        for (const c of results.data) {
            try {
                const geoResolution = this.createGeoResolution(c);
                const locationQuery = this.createLocationQuery(c);
                await axios.put('/api/cases', {
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
                    events: [
                        {
                            name: 'confirmed',
                            dateRange: {
                                start: c.dateConfirmed,
                                end: c.dateConfirmed,
                            },
                        },
                    ],
                    revisionMetadata: {
                        revisionNumber: 0,
                        creationMetadata: {
                            curator: this.props.user.email,
                            date: new Date().toISOString(),
                        },
                    },
                    sources: [
                        {
                            url: c.sourceUrl,
                        },
                    ],
                });
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
                initialValues={{ file: null }}
                onSubmit={(values): Promise<void> => this.submitCases(values)}
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

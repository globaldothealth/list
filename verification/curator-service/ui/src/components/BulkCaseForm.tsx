import { Button, withStyles } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

import BulkCaseFormValues from './BulkCaseFormValues';
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
            margin: '15px',
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
    // Using a generic type for now; will define case record later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async uploadData(results: ParseResult<Record<string, any>>): Promise<void> {
        for (const c of results.data) {
            try {
                await axios.put('/api/cases', {
                    caseReference: {
                        sourceId: c['sourceId'],
                        sourceEntryId: c['sourceEntryId'],
                    },
                    demographics: {
                        sex: c['sex'],
                        ageRange: {
                            start: c['ageRangeStart'],
                            end: c['ageRangeEnd'],
                        },
                    },
                    location: {
                        country: c['country'],
                        administrativeAreaLevel1: c['administrativeAreaLevel1'],
                        administrativeAreaLevel2: c['administrativeAreaLevel2'],
                        administrativeAreaLevel3: c['administrativeAreaLevel3'],
                        query: c['locationQuery'],
                        geometry: {
                            latitude: c['latitude'],
                            longitude: c['longitude'],
                        },
                        geoResolution: c['geoResolution'],
                        name: c['locationName'],
                    },
                    events: [
                        {
                            name: 'confirmed',
                            dateRange: {
                                start: c['dateConfirmedStart'],
                                end: c['dateConfirmedEnd'],
                            },
                        },
                    ],
                    sources: [
                        {
                            url: c['url'],
                        },
                    ],
                    revisionMetadata: {
                        revisionNumber: 0,
                        creationMetadata: {
                            curator: this.props.user.email,
                            date: new Date().toISOString(),
                        },
                    },
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
            const papaparseOptions: ParseConfig<Record<string, any>> = {
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

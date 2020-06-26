import { Button, withStyles } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

import BulkCaseFormValues from './BulkCaseFormValues';
import React from 'react';
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
        csvInput: {
            padding: '10px',
            display: 'block',
            border: '1px solid #ccc',
        },
        form: {
            margin: '15px',
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
                {({ isSubmitting, setFieldValue, submitForm }): JSX.Element => (
                    <Form className={classes.form}>
                        <input
                            className={classes.csvInput}
                            data-testid="csv-input"
                            id="file"
                            name="file"
                            type="file"
                            accept=".csv"
                            onChange={(
                                event: React.ChangeEvent<HTMLInputElement>,
                            ): void => {
                                if (event.currentTarget.files) {
                                    setFieldValue(
                                        'file',
                                        event.currentTarget.files[0],
                                    );
                                }
                            }}
                        />
                        <br />
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
                )}
            </Formik>
        );
    }
}

export default withStyles(styles)(BulkCaseForm);

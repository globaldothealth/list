import CSVReader, { IFileInfo } from 'react-csv-reader';

import React from 'react';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';

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
        csvInput: {
            padding: '10px',
            display: 'block',
            margin: '15px',
            border: '1px solid #ccc',
        },
        statusMessage: {
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
    // Array<any> is the type used by the source library for this data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async uploadData(data: Array<any>, fileInfo: IFileInfo): Promise<void> {
        for (const c of data) {
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

    render(): JSX.Element {
        const { classes } = this.props;
        const papaparseOptions = {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
        };
        return (
            <div className={classes.container}>
                <CSVReader
                    cssClass={classes.csvInput}
                    label="Select CSV with case data."
                    onFileLoaded={(data, fileInfo): Promise<void> => {
                        return this.uploadData(data, fileInfo);
                    }}
                    parserOptions={papaparseOptions}
                />
                {this.state.statusMessage && (
                    <h3 className={classes.statusMessage}>
                        {this.state.statusMessage as string}
                    </h3>
                )}
            </div>
        );
    }
}

export default withStyles(styles)(BulkCaseForm);

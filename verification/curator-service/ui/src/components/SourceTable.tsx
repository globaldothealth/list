import MaterialTable, { QueryResult } from 'material-table';
import { Theme, WithStyles, createStyles, withStyles } from '@material-ui/core';

import Paper from '@material-ui/core/Paper';
import React from 'react';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import { isUndefined } from 'util';

interface ListResponse {
    sources: Source[];
    nextPage: number;
    total: number;
}

interface Origin {
    url: string;
    license?: string;
}

interface Field {
    name: string;
    regex: string;
}

interface RegexParsing {
    fields: [Field];
}

interface Parser {
    awsLambdaArn: string;
}

interface Schedule {
    awsRuleArn?: string;
    awsScheduleExpression: string;
}

interface Automation {
    parser?: Parser;
    schedule: Schedule;
    regexParsing?: RegexParsing;
}

interface Source {
    _id: string;
    name: string;
    format?: string;
    origin: Origin;
    automation?: Automation;
}

interface SourceTableState {
    url: string;
    error: string;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    _id: string;
    name: string;
    // origin
    url: string;
    // automation
    // schedule
    awsRuleArn?: string;
    awsScheduleExpression?: string;
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        error: {
            color: 'red',
            marginTop: theme.spacing(2),
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = WithStyles<typeof styles>;

class SourceTable extends React.Component<Props, SourceTableState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/sources/',
            error: '',
        };
    }

    addSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (
                !(
                    this.validateRequired(rowData.name) &&
                    this.validateRequired(rowData.url) &&
                    this.validateAutomationFields(rowData)
                )
            ) {
                return reject();
            }
            const newSource = this.createSourceFromRowData(rowData);
            this.setState({ error: '' });
            const response = axios.post(this.state.url, newSource);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    deleteSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData._id;
            this.setState({ error: '' });
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    editSource(
        newRowData: TableRow,
        oldRowData: TableRow | undefined,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (isUndefined(oldRowData)) {
                return reject();
            }
            if (
                !(
                    this.validateRequired(newRowData.name) &&
                    this.validateRequired(newRowData.url) &&
                    this.validateAutomationFields(newRowData)
                )
            ) {
                return reject();
            }
            const newSource = this.updateSourceFromRowData(newRowData);
            this.setState({ error: '' });
            const response = axios.put(
                this.state.url + oldRowData._id,
                newSource,
            );
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    /**
     * Creates a source from the provided table row data.
     *
     * For new sources, an AWS rule ARN won't be defined (instead, it's created
     * by the server upon receiveing the create request). A schedule expression
     * may be supplied, and indicates the intent to create a corresponding AWS
     * scheduled event rule to automate source ingestion.
     */
    createSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url,
            },
            automation: rowData.awsScheduleExpression
                ? {
                    schedule: {
                        awsScheduleExpression: rowData.awsScheduleExpression,
                    },
                }
                : undefined,
        };
    }

    /**
     * Updates a source from the provided table row data.
     *
     * Unlike for creation, an AWS rule ARN may be supplied alongside a
     * schedule expression.
     */
    updateSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url,
            },
            automation: rowData.awsScheduleExpression
                ? {
                    schedule: {
                        awsRuleArn: rowData.awsRuleArn,
                        awsScheduleExpression: rowData.awsScheduleExpression,
                    },
                }
                : undefined,
        };
    }

    /**
     * Validates fields comprising the source.automation object.
     *
     * Rule ARN isn't necessarily present, because it isn't supplied in create
     * requests. It might be present for updates, and if so, the schedule
     * expression field must be present.
     */
    validateAutomationFields(rowData: TableRow): boolean {
        return (
            !rowData.awsRuleArn ||
            this.validateRequired(rowData.awsScheduleExpression)
        );
    }

    validateRequired(field: string | undefined): boolean {
        return field?.trim() !== '';
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div>
                <Paper>
                    <MaterialTable
                        columns={[
                            { title: 'ID', field: '_id', editable: 'never' },
                            {
                                title: 'Name',
                                field: 'name',
                                editComponent: (props): JSX.Element => (
                                    <TextField
                                        type="text"
                                        size="small"
                                        fullWidth
                                        placeholder="Name"
                                        error={
                                            !this.validateRequired(props.value)
                                        }
                                        helperText={
                                            this.validateRequired(props.value)
                                                ? ''
                                                : 'Required field'
                                        }
                                        onChange={(event): void =>
                                            props.onChange(event.target.value)
                                        }
                                        defaultValue={props.value}
                                    />
                                ),
                            },
                            {
                                title: 'URL',
                                field: 'url',
                                editComponent: (props): JSX.Element => (
                                    <TextField
                                        type="text"
                                        size="small"
                                        fullWidth
                                        placeholder="URL"
                                        error={
                                            !this.validateRequired(props.value)
                                        }
                                        helperText={
                                            this.validateRequired(props.value)
                                                ? ''
                                                : 'Required field'
                                        }
                                        onChange={(event): void =>
                                            props.onChange(event.target.value)
                                        }
                                        defaultValue={props.value}
                                    />
                                ),
                            },
                            {
                                title: 'AWS Schedule Expression',
                                field: 'awsScheduleExpression',
                            },
                            {
                                title: 'AWS Rule ARN',
                                field: 'awsRuleArn',
                                editable: 'never',
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + query.pageSize;
                                listUrl += '&page=' + (query.page + 1);
                                this.setState({ error: '' });
                                const response = axios.get<ListResponse>(
                                    listUrl,
                                );
                                response
                                    .then((result) => {
                                        const flattenedSources: TableRow[] = [];
                                        const sources = result.data.sources;
                                        for (const s of sources) {
                                            flattenedSources.push({
                                                _id: s._id,
                                                name: s.name,
                                                url: s.origin.url,
                                                awsRuleArn:
                                                    s.automation?.schedule
                                                        ?.awsRuleArn,
                                                awsScheduleExpression:
                                                    s.automation?.schedule
                                                        ?.awsScheduleExpression,
                                            });
                                        }
                                        resolve({
                                            data: flattenedSources,
                                            page: query.page,
                                            totalCount: result.data.total,
                                        });
                                    })
                                    .catch((e) => {
                                        this.setState({ error: e.toString() });
                                        reject(e);
                                    });
                            })
                        }
                        title="Ingestion sources"
                        options={{
                            // TODO: Create text indexes and support search queries.
                            // https://docs.mongodb.com/manual/text-search/
                            search: false,
                            filtering: false,
                            pageSize: 10,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                        }}
                        editable={{
                            onRowAdd: (rowData: TableRow): Promise<unknown> =>
                                this.addSource(rowData),
                            onRowUpdate: (
                                newRowData: TableRow,
                                oldRowData: TableRow | undefined,
                            ): Promise<unknown> =>
                                this.editSource(newRowData, oldRowData),
                            onRowDelete: (
                                rowData: TableRow,
                            ): Promise<unknown> => this.deleteSource(rowData),
                        }}
                    />
                </Paper>
                {this.state.error && (
                    <div className={classes.error}>{this.state.error}</div>
                )}
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(SourceTable);

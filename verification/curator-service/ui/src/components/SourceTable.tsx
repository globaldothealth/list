import {
    Button,
    Divider,
    MenuItem,
    Theme,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core';
import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';

import MuiAlert from '@material-ui/lab/Alert';
import Paper from '@material-ui/core/Paper';
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

interface DateFilter {
    numDaysBeforeToday?: number;
    op?: string;
}

interface Source {
    _id: string;
    name: string;
    format?: string;
    origin: Origin;
    automation?: Automation;
    dateFilter?: DateFilter;
}

interface SourceTableState {
    url: string;
    error: string;
    pageSize: number;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    _id: string;
    name: string;
    // origin
    url: string;
    // automation.parser

    format?: string;
    awsLambdaArn?: string;
    // automation.schedule
    awsRuleArn?: string;
    awsScheduleExpression?: string;
    // dateFilter
    dateFilter?: DateFilter;
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        error: {
            color: 'red',
            marginTop: theme.spacing(2),
        },
        alert: {
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(2),
        },
        divider: {
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(1),
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = WithStyles<typeof styles>;

class SourceTable extends React.Component<Props, SourceTableState> {
    tableRef: RefObject<any> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/sources/',
            error: '',
            pageSize: 10,
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
     * by the server upon receiving the create request). A schedule expression
     * may be supplied, and indicates the intent to create a corresponding AWS
     * scheduled event rule to automate source ingestion. If a schedule
     * expression is supplied, it's also possible that a parser Lambda ARN is
     * supplied.
     */
    createSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url,
            },
            format: rowData.format,
            automation: rowData.awsScheduleExpression
                ? {
                      parser: rowData.awsLambdaArn
                          ? {
                                awsLambdaArn: rowData.awsLambdaArn,
                            }
                          : undefined,
                      schedule: {
                          awsScheduleExpression: rowData.awsScheduleExpression,
                      },
                  }
                : undefined,
            dateFilter:
                rowData.dateFilter?.numDaysBeforeToday && rowData.dateFilter?.op
                    ? rowData.dateFilter
                    : undefined,
        };
    }

    /**
     * Updates a source from the provided table row data.
     *
     * Unlike for creation, an AWS rule ARN may be supplied alongside a
     * schedule expression (and optionally, a parser Lambda ARN).
     */
    updateSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url,
            },
            format: rowData.format,
            automation: rowData.awsScheduleExpression
                ? {
                      parser: rowData.awsLambdaArn
                          ? {
                                awsLambdaArn: rowData.awsLambdaArn,
                            }
                          : undefined,
                      schedule: {
                          awsRuleArn: rowData.awsRuleArn,
                          awsScheduleExpression: rowData.awsScheduleExpression,
                      },
                  }
                : undefined,
            dateFilter:
                rowData.dateFilter?.numDaysBeforeToday || rowData.dateFilter?.op
                    ? rowData.dateFilter
                    : {},
        };
    }

    /**
     * Validates fields comprising the source.automation object.
     *
     * Rule ARN isn't necessarily present, because it isn't supplied in create
     * requests. It might be present for updates, and if so, the schedule
     * expression field must be present. Likewise, if parser Lambda ARN is
     * present, the schedule expression field must be present.
     */
    validateAutomationFields(rowData: TableRow): boolean {
        return (
            (!rowData.awsRuleArn && !rowData.awsLambdaArn) ||
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
                    {this.state.error && (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="filled"
                            severity="error"
                        >
                            {this.state.error}
                        </MuiAlert>
                    )}
                    <MaterialTable
                        tableRef={this.tableRef}
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
                                title: 'Format',
                                field: 'format',
                                editComponent: (props): JSX.Element => (
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        data-testid="format-select"
                                        placeholder="Format"
                                        onChange={(event): void =>
                                            props.onChange(event.target.value)
                                        }
                                        defaultValue={props.value || ''}
                                    >
                                        {['', 'JSON', 'CSV'].map((value) => (
                                            <MenuItem
                                                key={`format-${value}`}
                                                value={value || ''}
                                            >
                                                {value || 'Unknown'}
                                            </MenuItem>
                                        ))}
                                    </TextField>
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
                            {
                                title: 'AWS Parser ARN',
                                field: 'awsLambdaArn',
                            },
                            {
                                title: 'Date filtering',
                                field: 'dateFilter',
                                render: (rowData): JSX.Element =>
                                    rowData.dateFilter?.op === 'EQ' ? (
                                        <div>
                                            Only parse data from{' '}
                                            {
                                                rowData.dateFilter
                                                    ?.numDaysBeforeToday
                                            }{' '}
                                            days ago
                                        </div>
                                    ) : rowData.dateFilter?.op === 'LT' ? (
                                        <div>
                                            Parse all data up to{' '}
                                            {
                                                rowData.dateFilter
                                                    ?.numDaysBeforeToday
                                            }{' '}
                                            ago
                                        </div>
                                    ) : (
                                        <div>None</div>
                                    ),
                                editComponent: (props): JSX.Element => (
                                    <>
                                        Only parse data
                                        <TextField
                                            select
                                            fullWidth
                                            size="small"
                                            data-testid="op-select"
                                            placeholder="Operator"
                                            onChange={(event): void =>
                                                props.onChange({
                                                    numDaysBeforeToday:
                                                        props.value
                                                            ?.numDaysBeforeToday,
                                                    op: event.target.value,
                                                })
                                            }
                                            value={props.value?.op || ''}
                                        >
                                            {[
                                                { text: 'Unknown', value: '' },
                                                {
                                                    text: 'from exactly',
                                                    value: 'EQ',
                                                },
                                                { text: 'up to', value: 'LT' },
                                            ].map((pair) => (
                                                <MenuItem
                                                    key={`op-${pair.value}`}
                                                    value={pair.value || ''}
                                                >
                                                    {pair.text}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            data-testid="num-days"
                                            placeholder="days"
                                            onChange={(event): void =>
                                                props.onChange({
                                                    numDaysBeforeToday:
                                                        event.target.value,
                                                    op: props.value?.op,
                                                })
                                            }
                                            value={
                                                props.value
                                                    ?.numDaysBeforeToday || ''
                                            }
                                        ></TextField>
                                        days ago
                                        <Divider
                                            variant="middle"
                                            className={classes.divider}
                                        />
                                        <Button
                                            variant="contained"
                                            data-testid="clear-date-filter"
                                            onClick={() => {
                                                props.onChange({});
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </>
                                ),
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + this.state.pageSize;
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
                                                format: s.format,
                                                url: s.origin.url,
                                                awsLambdaArn:
                                                    s.automation?.parser
                                                        ?.awsLambdaArn,
                                                awsRuleArn:
                                                    s.automation?.schedule
                                                        ?.awsRuleArn,
                                                awsScheduleExpression:
                                                    s.automation?.schedule
                                                        ?.awsScheduleExpression,
                                                dateFilter: s.dateFilter,
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
                            sorting: false,
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            pageSize: this.state.pageSize,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            maxBodyHeight: 'calc(100vh - 15em)',
                            headerStyle: {
                                zIndex: 1,
                            },
                        }}
                        onChangeRowsPerPage={(newPageSize: number) => {
                            this.setState({ pageSize: newPageSize });
                            this.tableRef.current.onQueryChange();
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
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(SourceTable);

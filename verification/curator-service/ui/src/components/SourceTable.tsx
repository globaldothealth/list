import {
    Button,
    Divider,
    MenuItem,
    TablePagination,
    Theme,
    Typography,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core';
import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';

import MuiAlert from '@material-ui/lab/Alert';
import Paper from '@material-ui/core/Paper';
import ParsersAutocomplete from './ParsersAutocomplete';
import SourceRetrievalButton from './SourceRetrievalButton';
import TextField from '@material-ui/core/TextField';
import User from './User';
import axios from 'axios';
import { isUndefined } from 'util';
import ChipInput from 'material-ui-chip-input';

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
    schedule?: Schedule;
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
    notificationRecipients?: string[];
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

    license?: string;
    // automation.parser

    format?: string;
    awsLambdaArn?: string;
    // automation.schedule
    awsRuleArn?: string;
    awsScheduleExpression?: string;
    dateFilter?: DateFilter;
    notificationRecipients?: string[];
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
        spacer: { flex: 1 },
        tablePaginationBar: {
            alignItems: 'center',
            backgroundColor: '#ECF3F0',
            display: 'flex',
            height: '64px',
        },
        tableTitle: {
            width: '100%',
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    user: User;
}

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

    deleteSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData._id;
            this.setState({ error: '' });
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
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
                    this.validateRequired(newRowData.license) &&
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
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                reject(e);
            });
        });
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
                license: rowData.license,
            },
            format: rowData.format,
            automation:
                rowData.awsScheduleExpression || rowData.awsLambdaArn
                    ? {
                          parser: rowData.awsLambdaArn
                              ? {
                                    awsLambdaArn: rowData.awsLambdaArn,
                                }
                              : undefined,
                          schedule: rowData.awsScheduleExpression
                              ? {
                                    awsRuleArn: rowData.awsRuleArn,
                                    awsScheduleExpression:
                                        rowData.awsScheduleExpression,
                                }
                              : undefined,
                      }
                    : undefined,
            dateFilter:
                rowData.dateFilter?.numDaysBeforeToday || rowData.dateFilter?.op
                    ? rowData.dateFilter
                    : undefined,
            notificationRecipients: rowData.notificationRecipients,
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
                                title: 'License',
                                field: 'license',
                                tooltip: 'MIT, Apache V2, ...',
                                editComponent: (props): JSX.Element => (
                                    <TextField
                                        type="text"
                                        size="small"
                                        fullWidth
                                        placeholder="License"
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
                                title: 'Notification recipients',
                                field: 'notificationRecipients',
                                tooltip:
                                    'Email addresses of parties to be notified of critical changes',
                                render: (rowData): string =>
                                    rowData.notificationRecipients
                                        ? rowData.notificationRecipients?.join(
                                              '\n',
                                          )
                                        : '',
                                editComponent: (props): JSX.Element => (
                                    <ChipInput
                                        defaultValue={props.value || []}
                                        onChange={(value: string[]): void =>
                                            props.onChange(value)
                                        }
                                        placeholder="Email address(es)"
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
                            {
                                title: 'Parser function',
                                field: 'awsLambdaArn',
                                editComponent: (props): JSX.Element => (
                                    <ParsersAutocomplete
                                        defaultValue={props.value || ''}
                                        onChange={props.onChange}
                                    />
                                ),
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
                            {
                                title: 'Curation actions',
                                render: (row): JSX.Element => (
                                    <SourceRetrievalButton sourceId={row._id} />
                                ),
                                editable: 'never',
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
                                                license: s.origin.license,
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
                                                notificationRecipients:
                                                    s.notificationRecipients,
                                            });
                                        }
                                        resolve({
                                            data: flattenedSources,
                                            page: query.page,
                                            totalCount: result.data.total,
                                        });
                                    })
                                    .catch((e) => {
                                        this.setState({
                                            error:
                                                e.response?.data?.message ||
                                                e.toString(),
                                        });
                                        reject(e);
                                    });
                            })
                        }
                        components={{
                            Container: (props): JSX.Element => (
                                <Paper elevation={0} {...props}></Paper>
                            ),
                            Pagination: (props): JSX.Element => {
                                return (
                                    <div className={classes.tablePaginationBar}>
                                        <Typography
                                            classes={{
                                                root: classes.tableTitle,
                                            }}
                                        >
                                            Ingestion sources
                                        </Typography>
                                        <span className={classes.spacer}></span>
                                        <TablePagination
                                            {...props}
                                        ></TablePagination>
                                    </div>
                                );
                            },
                        }}
                        style={{ fontFamily: 'Inter' }}
                        options={{
                            // TODO: Create text indexes and support search queries.
                            // https://docs.mongodb.com/manual/text-search/
                            search: false,
                            filtering: false,
                            sorting: false,
                            emptyRowsWhenPaging: false,
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            pageSize: this.state.pageSize,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            paginationPosition: 'top',
                            toolbar: false,
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

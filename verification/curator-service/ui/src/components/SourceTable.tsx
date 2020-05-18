import MaterialTable, { QueryResult } from 'material-table';
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
    awsRuleArn: string;
}

interface Automation {
    parser: Parser;
    schedule: Schedule;
    regexParsing: RegexParsing;
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
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    _id: string;
    name: string;
    // origin
    url: string;
}

export default class SourceTable extends React.Component<{}, SourceTableState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            url: '/api/sources/',
        };
    }

    addSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (
                !(
                    this.validateRequired(rowData.name) &&
                    this.validateRequired(rowData.url)
                )
            ) {
                return reject();
            }
            const newSource = this.createSourceFromRowData(rowData);
            const response = axios.post(this.state.url, newSource);
            response.then(resolve).catch((e) => {
                reject(e);
            });
        });
    }

    deleteSource(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData._id;
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
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
                    this.validateRequired(newRowData.url)
                )
            ) {
                return reject();
            }
            const newSource = this.createSourceFromRowData(newRowData);
            const response = axios.put(
                this.state.url + oldRowData._id,
                newSource,
            );
            response.then(resolve).catch((e) => {
                reject(e);
            });
        });
    }

    createSourceFromRowData(rowData: TableRow): Source {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url,
            },
        };
    }

    validateRequired(field: string): boolean {
        return field?.trim() !== '';
    }

    render(): JSX.Element {
        return (
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
                                    placeholder="URL"
                                    error={!this.validateRequired(props.value)}
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
                                    error={!this.validateRequired(props.value)}
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
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + query.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedSources: TableRow[] = [];
                                    const sources = result.data.sources;
                                    for (const s of sources) {
                                        flattenedSources.push({
                                            _id: s._id,
                                            name: s.name,
                                            url: s.origin.url,
                                        });
                                    }
                                    resolve({
                                        data: flattenedSources,
                                        page: query.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
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
                        onRowDelete: (rowData: TableRow): Promise<unknown> =>
                            this.deleteSource(rowData),
                    }}
                />
            </Paper>
        );
    }
}

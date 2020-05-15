import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';

interface ListResponse {
    sources: Source[],
    nextPage: number,
    total: number,
}

interface Origin {
    url: string;
    license: string;
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
    format: string;
    origin: Origin;
    automation: Automation;
}

interface SourceTableState {
    url: string,
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    _id: string;
    name: string;
    // origin
    url: string;
}

export default class SourceTable extends React.Component<{}, SourceTableState> {
    constructor(props: any) {
        super(props);
        this.state = {
            url: '/api/sources/',
        }
    }

    addSource(rowData: TableRow) {
        return new Promise((resolve, reject) => {
            if (!(this.validateRequired(rowData.name) &&
                this.validateRequired(rowData.url))) {
                return reject();
            }
            const newSource = this.createSourceFromRowData(rowData);
            const response = axios.post(this.state.url, newSource);
            response
                .then(resolve)
                .catch((e) => {
                    reject(e);
                });
        });
    }

    deleteSource(rowData: TableRow) {
        return new Promise((resolve, reject) => {
            let deleteUrl = this.state.url + rowData._id;
            const response = axios.delete(deleteUrl);
            response
                .then(resolve)
                .catch((e) => {
                    reject(e);
                });
        })
    }

    createSourceFromRowData(rowData: TableRow) {
        return {
            _id: rowData._id,
            name: rowData.name,
            origin: {
                url: rowData.url
            }
        }
    }

    validateRequired(field: String) {
        return field?.trim() !== "";
    }

    render() {
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: '_id', editable: "never" },
                        { title: 'Name', field: 'name' },
                        {
                            title: 'URL', field: 'url',
                            editComponent: (props) =>
                                (<TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    placeholder="Source URL"
                                    error={!this.validateRequired(props.value)}
                                    helperText={this.validateRequired(props.value) ? "" : "Required field"}
                                    onChange={event => props.onChange(event.target.value)}
                                    defaultValue={props.value} />)
                        },
                    ]}

                    data={query =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + query.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const response = axios.get<ListResponse>(listUrl);
                            response.then(result => {
                                let flattened_sources: TableRow[] = [];
                                const sources = result.data.sources;
                                for (const s of sources) {
                                    flattened_sources.push({
                                        _id: s._id,
                                        name: s.name,
                                        url: s.origin.url,
                                    });
                                }
                                resolve({
                                    data: flattened_sources,
                                    page: query.page,
                                    totalCount: result.data.total,
                                });
                            }).catch((e) => {
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
                        onRowAdd: (rowData: TableRow) => this.addSource(rowData),
                        onRowDelete: (rowData: TableRow) => this.deleteSource(rowData),
                    }}
                />
            </Paper>
        )
    }
}
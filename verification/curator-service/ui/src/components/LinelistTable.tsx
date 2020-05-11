import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import React from 'react';
import axios from 'axios';
import { isUndefined } from 'util';

interface ListResponse {
    cases: Case[],
    nextPage: number,
    total: number,
}

interface Event {
    name: string;
    dateRange: {
        start: string;
        end: string;
    };
}

interface Demographics {
    sex: string;
    age: string;
}

interface Source {
    url: string;
}

interface Case {
    _id: string;
    importedCase: {
        outcome: string;
    };
    events: Event[];
    demographics: Demographics;
    source: Source;
    notes: string;
}

interface LinelistTableState {
    tableRef: any,
    url: string,
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    // demographics
    sex: string;
    age: string;
    // source
    source_url: string;
    notes: string;
}

export default class LinelistTable extends React.Component<{}, LinelistTableState> {
    constructor(props: any) {
        super(props);
        this.state = {
            tableRef: React.createRef(),
            url: '/api/cases/',
        }
    }

    createCaseFromRowData(rowData: TableRow) {
        return {
            demographics: {
                sex: rowData.sex
            },
            notes: rowData.notes,
            source: {
                url: rowData.source_url
            },
            // TODO: Replace data below with data from rowData
            location: {
                country: "France",
            },
            events: {
                name: "confirmed",
                dateRange: {
                    start: "2020-01-13T05:00:00.000Z",
                    end: "2020-01-13T05:00:00.000Z",
                },
            },
            revisionMetadata: {
                date: "2020-04-23T04:00:00.000Z",
                id: 0,
                moderator: "abc123"
            }
        }
    }

    addCase(newRowData: TableRow) {
        return new Promise((resolve, reject) => {
            if (!this.validateRequired(newRowData.source_url)) {
                return reject();
            }
            const newCase = this.createCaseFromRowData(newRowData);
            const response = axios.post(this.state.url, newCase);
            response.then(() => {
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
                resolve();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    deleteCase(rowData: TableRow) {
        return new Promise((resolve, reject) => {
            let deleteUrl = this.state.url + rowData.id;
            const response = axios.delete(deleteUrl);
            response.then(() => {
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
                resolve();
            }).catch((e) => {
                reject(e);
            });
        })
    }

    editCase(newRowData: TableRow, oldRowData: TableRow | undefined) {
        return new Promise((resolve, reject) => {
            if (isUndefined(oldRowData)) {
                return reject();
            }
            if (!this.validateRequired(newRowData.source_url)) {
                return reject();
            }
            const newCase = this.createCaseFromRowData(newRowData);
            const response = axios.put(this.state.url + oldRowData.id, newCase);
            response.then(() => {
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
                resolve();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    validateRequired(field: String) {
        return field.trim() !== "";
    }

    render() {
        return (
            <Paper>
                <MaterialTable
                    tableRef={this.state.tableRef}
                    columns={[
                        { title: 'ID', field: 'id', filtering: false, editable: "never" },
                        { title: 'Sex', field: 'sex', filtering: false, lookup: { "Female": "Female", "Male": "Male" } },
                        { title: 'Age', field: 'age', filtering: false, type: "numeric" },
                        { title: 'Notes', field: 'notes' },
                        {
                            title: 'Source URL', field: 'source_url', filtering: false,
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
                            listUrl += '&filter=';
                            listUrl += query.filters.map((filter) => `${filter.column.field}:${filter.value}`).join(",");
                            const response = axios.get<ListResponse>(listUrl);
                            response.then(result => {
                                let flattened_cases: TableRow[] = [];
                                const cases = result.data.cases;
                                for (const c of cases) {
                                    flattened_cases.push({
                                        id: c._id,
                                        sex: c.demographics?.sex,
                                        age: c.demographics?.age,
                                        notes: c.notes,
                                        source_url: c.source?.url,
                                    });
                                }
                                resolve({
                                    data: flattened_cases,
                                    page: query.page,
                                    totalCount: result.data.total,
                                });
                            }).catch((e) => {
                                reject(e);
                            });
                        })
                    }
                    title="COVID-19 cases"
                    options={{
                        // TODO: Create text indexes and support search queries.
                        // https://docs.mongodb.com/manual/text-search/
                        search: false,
                        filtering: true,
                        padding: "dense",
                        pageSize: 10,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                    }}
                    editable={{
                        onRowAdd: (newRowData: TableRow) => this.addCase(newRowData),
                        onRowUpdate: (newRowData: TableRow, oldRowData: TableRow | undefined) =>
                            this.editCase(newRowData, oldRowData),
                        onRowDelete: (rowData: TableRow) => this.deleteCase(rowData),
                    }}
                />
            </Paper>
        )
    }
}
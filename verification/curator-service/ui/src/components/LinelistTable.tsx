import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import axios from 'axios';

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

export default class LinelistTable extends React.Component<{}, LinelistTableState> {
    constructor(props: any) {
        super(props);
        this.state = {
            tableRef: React.createRef(),
            url: (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/',
        }
    }

    addCase(newRowData: Case) {
        return new Promise((resolve, reject) => {
            const newCase = {
                demographics: {
                    sex: newRowData.demographics
                },
                notes: newRowData.notes,
                source: {
                    url: newRowData.source
                }
            }
            const response = axios.post(this.state.url, newCase);
            response.then(() => {
                resolve();
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    deleteCase(rowData: Case) {
        return new Promise((reject) => {
            let deleteUrl = this.state.url + rowData._id;
            const response = axios.delete(deleteUrl);
            response.then(() => {
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
            }).catch((e) => {
                reject(e);
            });
        })
    }

    editCase(newRowData: Case, oldRowData: Case | undefined) {
        return new Promise(() => {
            console.log("TODO: edit " + newRowData);
            // Refresh the table data
            this.state.tableRef.current.onQueryChange();
        });
    }

    render() {
        return (
            <Paper>
                <MaterialTable
                    tableRef={this.state.tableRef}
                    columns={[
                        { title: 'ID', field: '_id', filtering: false },
                        {
                            title: 'Demographics', field: 'demographics',
                            filtering: false,
                            render: rowData => <span>{rowData.demographics?.sex}</span>,
                        },
                        { title: 'Notes', field: 'notes' },
                        {
                            title: 'Source', field: 'source',
                            filtering: false,
                            render: rowData => <span>{rowData.source?.url}</span>,
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
                                resolve({
                                    data: result.data.cases,
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
                        pageSize: 10,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                    }}
                    editable={{
                        onRowAdd: (newRowData: Case) => this.addCase(newRowData),
                        onRowUpdate: (newRowData: Case, oldRowData: Case | undefined) =>
                            this.editCase(newRowData, oldRowData),
                        onRowDelete: (rowData: Case) => this.deleteCase(rowData),
                    }}
                />
            </Paper>
        )
    }
}
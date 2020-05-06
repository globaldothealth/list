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
            url: (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/',
        }
    }

    addCase(newRowData: TableRow) {
        return new Promise((resolve, reject) => {
            const newCase = {
                demographics: {
                    sex: newRowData.sex
                },
                notes: newRowData.notes,
                source: {
                    url: newRowData.source_url
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

    deleteCase(rowData: TableRow) {
        return new Promise((reject) => {
            let deleteUrl = this.state.url + rowData.id;
            const response = axios.delete(deleteUrl);
            response.then(() => {
                // Refresh the table data
                this.state.tableRef.current.onQueryChange();
            }).catch((e) => {
                reject(e);
            });
        })
    }

    editCase(newRowData: TableRow, oldRowData: TableRow | undefined) {
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
                        { title: 'ID', field: 'id', filtering: false },
                        { title: 'Sex', field: 'sex', filtering: false },
                        { title: 'Age', field: 'age', filtering: false },
                        { title: 'Notes', field: 'notes' },
                        { title: 'Source URL', field: 'source_url', filtering: false },
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
import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import TextField from '@material-ui/core/TextField';
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

interface Location {
    country: string;
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
    location: Location;
    source: Source;
    notes: string;
}

interface LinelistTableState {
    url: string,
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    // demographics
    sex: string;
    age: string;
    country: string;
    confirmedDate: Date | null;
    // source
    source_url: string;
    notes: string;
}

export default class LinelistTable extends React.Component<{}, LinelistTableState> {
    constructor(props: any) {
        super(props);
        this.state = {
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
            location: {
                country: rowData.country,
            },
            events: [{
                name: "confirmed",
                dateRange: {
                    start: rowData.confirmedDate?.toISOString() ?? '',
                },
            }],
            // TODO: Replace data below with real values
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
            console.log('here');
            const newCase = this.createCaseFromRowData(newRowData);
            console.log('here2');
            const response = axios.put(this.state.url + oldRowData.id, newCase);
            response.then(() => {
                resolve();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    validateRequired(field: String) {
        return field?.trim() !== "";
    }

    render() {
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: 'id', filtering: false, editable: "never" },
                        { title: 'Sex', field: 'sex', filtering: false, lookup: { "Female": "Female", "Male": "Male" } },
                        { title: 'Age', field: 'age', filtering: false, type: "numeric" },
                        { title: 'Country', field: 'country', filtering: false },
                        { title: 'Confirmed date', field: 'confirmedDate', filtering: false, type: "date" },
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
                                    const confirmedDate =
                                        c.events.find((event) => event.name === "confirmed")?.dateRange?.start;
                                    flattened_cases.push({
                                        id: c._id,
                                        sex: c.demographics?.sex,
                                        age: c.demographics?.age,
                                        country: c.location.country,
                                        confirmedDate: confirmedDate ? new Date(confirmedDate) : null,
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
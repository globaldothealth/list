import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import axios from 'axios';

interface ListResponse {
    cases: Case[],
    nextPage: number,
    total: number,
}

interface RowProps {
    background: string
    case: Case
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

export default class LinelistTable extends React.Component {

    render() {
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: '_id' },
                        {
                            title: 'Demographics', field: 'demographics',
                            render: rowData => <span>{rowData.demographics?.sex}</span>,
                        },
                        { title: 'Notes', field: 'notes' },
                        {
                            title: 'Source', field: 'source',
                            render: rowData => <span>{rowData.source?.url}</span>,
                        },
                    ]}

                    data={query =>
                        new Promise((resolve, reject) => {
                            let url = (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/';
                            url += '?limit=' + query.pageSize;
                            url += '&page=' + (query.page + 1);
                            const response = axios.get<ListResponse>(url);
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
                        // TODO: would be really useful, send query to server.
                        search: false,
                    }}
                    actions={[
                        {
                            icon: 'edit',
                            tooltip: 'Edit case',
                            onClick: (event, rowData) => console.log("TODO: edit " + rowData),
                        },
                        {
                            icon: 'delete',
                            tooltip: 'Delete case',
                            onClick: (event, rowData) => console.log("TODO: delete " + rowData),
                        }
                    ]}
                />
            </Paper>
        )
    }
}
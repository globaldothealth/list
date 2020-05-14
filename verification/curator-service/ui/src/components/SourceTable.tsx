import MaterialTable from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
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
    regexp: string;
}

interface Parsing {
    fields: Array<Field>;
}

interface Automation {
    name: string;
    tag: string;
    active: boolean;
    scheduleExpression: string;
    parsing: Parsing;
}

interface Source {
    _id: string;
    name: string;
    origin: Origin;
    format: string;
    automation: Automation;
}

interface SourceTableState {
    url: string,
}

export default class SourceTable extends React.Component<{}, SourceTableState> {
    constructor(props: any) {
        super(props);
        this.state = {
            url: '/api/sources/',
        }
    }

    render() {
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: '_id' },
                        { title: 'Name', field: 'name' },
                    ]}

                    data={query =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + query.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const response = axios.get<ListResponse>(listUrl);
                            response.then(result => {
                                resolve({
                                    data: result.data.sources,
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
                />
            </Paper>
        )
    }
}
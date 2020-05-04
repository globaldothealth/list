import { Case } from './LinelistCaseRow';
import MaterialTable from 'material-table'
import Paper from '@material-ui/core/Paper';
import React from 'react';
import axios from 'axios';

interface TableState {
    errorMessage: string,
    isLoaded: boolean,
    linelist: Case[],
    page: number,
    rowsPerPage: number
}

export default class LinelistTable extends React.Component<{}, TableState> {

    constructor(props: any) {
        super(props);
        this.state = {
            errorMessage: '',
            isLoaded: false,
            linelist: [],
            page: 0,
            rowsPerPage: 10
        };
    }

    async componentDidMount() {
        try {
            const response = await axios.get<Case[]>((process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/');
            this.setState({
                isLoaded: true,
                linelist: response.data
            });
        } catch (e) {
            this.setState({
                isLoaded: true,
                errorMessage: e.message
            });
        }
    }

    render() {
        const { errorMessage, isLoaded } = this.state;
        if (errorMessage.length > 0) {
            return <div>Error: {errorMessage}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        }
        return (
            <Paper>
                <MaterialTable
                    columns={[
                        { title: 'ID', field: '_id' },
                        {
                            title: 'Demographics', field: 'demographics',
                            render: rowData => <span>{rowData.demographics.sex}</span>,
                        },
                        //{ title: 'Outcome', field: 'outcome' },
                    ]}

                    data={query =>
                        new Promise((resolve, reject) => {
                            let url = (process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/';
                            url += '?limit=' + query.pageSize;
                            url += '&page=' + (query.page + 1);
                            const response = axios.get<Case[]>(url);
                            // prepare your data and then call resolve like this:
                            response.then(result => {
                                resolve({
                                    data: result.data,
                                    page: query.page - 1,
                                    totalCount: result.data.length,
                                });
                            });
                        })
                    }
                    title="COVID-19 cases"
                />
            </Paper>
        )
    }
}
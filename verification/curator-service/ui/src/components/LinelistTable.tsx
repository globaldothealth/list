import LinelistCaseRow, { Case } from "./LinelistCaseRow";

import Paper from '@material-ui/core/Paper';
import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import axios from 'axios';

interface ListResponse {
    cases: Case[],
    nextPage: number,
    total: number,
}
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
            const response = await axios.get<ListResponse>((process.env.REACT_APP_DATA_API_ENDPOINT || "") + '/api/cases/');
            this.setState({
                isLoaded: true,
                linelist: response.data.cases,
            });
        } catch (e) {
            this.setState({
                isLoaded: true,
                errorMessage: e.message,
            });
        }
    }

    handleChangePage = (event: unknown, newPage: number) => {
        this.setState({ page: newPage });
    };

    handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ rowsPerPage: parseInt(event.target.value, 10) });
    };

    render() {
        const { errorMessage, isLoaded, linelist, page, rowsPerPage } = this.state;
        if (errorMessage.length > 0) {
            return <div>Error: {errorMessage}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        }
        return (
            <Paper>
                <TableContainer>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow style={{ background: '#cfd8dc' }}>
                                <TableCell>ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Outcome</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody >
                            {(rowsPerPage > 0
                                ? linelist.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                : linelist
                            ).map((item, index) => (
                                <LinelistCaseRow
                                    background={index % 2 ? "white" : "#f5f5f5"}
                                    case={item}
                                    key={item._id}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={linelist.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                /></Paper>
        )
    }
}
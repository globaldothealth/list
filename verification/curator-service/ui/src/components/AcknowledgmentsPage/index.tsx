import React, { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import Helmet from 'react-helmet';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';
import { fetchAcknowledgmentData } from '../../redux/acknowledgmentData/thunk';
import { SnackbarAlert } from '../SnackbarAlert';
import EnhancedTableHead from './EnhancedTableHead';

import {
    selectAcknowledgmentData,
    selectIsLoading,
    selectError,
} from '../../redux/acknowledgmentData/selectors';
import { resetError } from '../../redux/acknowledgmentData/slice';
import { useTableStyles } from './styled';
import { Data, Order } from './types';
import { createData, getComparator, stableSort } from './helperFunctions';

export default function AcknowledgmentsPage(): JSX.Element {
    const classes = useTableStyles();
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Data>('providerName');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [rows, setRows] = React.useState<Data[]>([]);
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchAcknowledgmentData());
    }, [dispatch]);

    const sources = useAppSelector(selectAcknowledgmentData);
    const isLoading = useAppSelector(selectIsLoading);
    const error = useAppSelector(selectError);

    useEffect(() => {
        const newRows: Data[] = [];

        sources.map((el) => {
            newRows.push(
                createData(
                    el._id,
                    el.origin.providerName || el.name,
                    el.origin.providerWebisteUrl || el.origin.url,
                    el.origin.license,
                ),
            );
            return {};
        });

        setRows(newRows);
    }, [sources]);

    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: keyof Data,
    ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const createHyperlink = (url: string) => {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer">
                {url}
            </a>
        );
    };

    return (
        <>
            <Helmet>
                <title>Global.health | Data Acknowledment</title>
            </Helmet>
            <div className={classes.root}>
                <Typography variant="h1" className={classes.pageTitle}>
                    Data Acknowledgments
                </Typography>
                <Typography variant="body1" className={classes.pageSubTitle}>
                    We acknowledge the hard work and open-science of the
                    individual research labs and public health bodies that have
                    made epidemiological data available. A detailed table of
                    acknowledgements for the data used on this platform is
                    below.
                </Typography>
                <Paper className={classes.paper}>
                    {isLoading && (
                        <div className={classes.loaderConrainer}>
                            <CircularProgress
                                color="primary"
                                data-cy="loader"
                            />
                        </div>
                    )}
                    <TableContainer>
                        <Table
                            className={classes.table}
                            aria-labelledby="tableTitle"
                            aria-label="enhanced table"
                        >
                            <EnhancedTableHead
                                classes={classes}
                                numSelected={0}
                                order={order}
                                orderBy={orderBy}
                                onRequestSort={handleRequestSort}
                                rowCount={sources.length}
                            />
                            <TableBody>
                                {stableSort(rows, getComparator(order, orderBy))
                                    .slice(
                                        page * rowsPerPage,
                                        page * rowsPerPage + rowsPerPage,
                                    )
                                    .map((row) => {
                                        return (
                                            <TableRow
                                                className={classes.tableRow}
                                                hover
                                                tabIndex={-1}
                                                key={row._id}
                                            >
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    padding="normal"
                                                >
                                                    {row.providerName}
                                                </TableCell>
                                                <TableCell align="left">
                                                    {createHyperlink(
                                                        row.dataSource,
                                                    )}
                                                </TableCell>
                                                <TableCell align="left">
                                                    {row.license ?? '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
                <Typography
                    variant="subtitle1"
                    className={classes.pageSubTitle}
                >
                    GISAID Data Acknowledgements
                </Typography>
                <Typography variant="body1" className={classes.pageSubTitle}>
                    We acknowledge the hard work and open-science of the
                    individual research labs and public health bodies that have
                    made genome data accessible through GISAID*. Please note
                    that data coming from GISAID cannot be downloaded through
                    this platform.
                </Typography>
                <Divider className={classes.divider} />

                <Typography variant="body2" className={classes.belowNote}>
                    * Elbe, S., and Buckland-Merrett, G. (2017) Data, disease
                    and diplomacy: GISAID’s innovative contribution to global
                    health. Global Challenges, 1:33-46. DOI:
                    10.1002/gch2.1018PMCID: 31565258 accessible via{' '}
                    <a href="https://pubmed.ncbi.nlm.nih.gov/31565258/">
                        https://pubmed.ncbi.nlm.nih.gov/31565258/
                    </a>
                </Typography>
            </div>

            <SnackbarAlert
                isOpen={Boolean(error)}
                message={error ?? 'Unexpected error, please try again later'}
                type="error"
                onClose={() => dispatch(resetError())}
            />
        </>
    );
}

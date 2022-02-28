import React, { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { selectUser } from '../redux/auth/selectors';
import { Theme, makeStyles, createStyles } from '@material-ui/core/styles';
import Helmet from 'react-helmet';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import axios from 'axios';
import { fetchAcknowledgmentData } from '../redux/acknowledgmentData/thunk';

import {
    acknowledgmentData,
    isLoading,
    acknowledgmentDataError,
} from '../redux/acknowledgmentData/selectors';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '80%',
            margin: '10em auto auto auto',
        },

        tableRow: {
            '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.action.hover,
            },
        },
        headerRow: {
            backgroundColor: theme.palette.primary.main,
        },
        headerCell: {
            color: '#fff',
            fontWeight: 'bold',
        },
        pageTitle: { fontSize: '2em', marginBottom: '1em' },
        pageSubTitle: {
            fontSize: '1.4em',
            marginBottom: '1.6em',
            width: '70%',
        },
        divider: {
            width: '70%',
        },
        belowNote: {
            width: '70%',
            marginTop: '0.4em',
        },
        paper: {
            width: '100%',
            marginBottom: theme.spacing(2),
        },
        table: {
            minWidth: 750,
        },
        visuallyHidden: {
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: 1,
            margin: -1,
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            top: 20,
            width: 1,
        },
    }),
);
interface Data {
    country: string;
    license: string;
    originDataSource: string;
    dataContributor: string;
}

function createData(
    dataContributor: string,
    country: string,
    originDataSource: string,
    license: string,
): Data {
    return { dataContributor, country, originDataSource, license };
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
): (
    a: { [key in Key]: number | string },
    b: { [key in Key]: number | string },
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
    disablePadding: boolean;
    id: keyof Data;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    {
        id: 'dataContributor',
        numeric: false,
        disablePadding: false,
        label: 'Data contributor',
    },
    { id: 'country', numeric: false, disablePadding: false, label: 'Country' },
    {
        id: 'originDataSource',
        numeric: false,
        disablePadding: false,
        label: 'Origin data source',
    },
    { id: 'license', numeric: false, disablePadding: false, label: 'License' },
];

interface EnhancedTableProps {
    classes: ReturnType<typeof useStyles>;
    numSelected: number;
    onRequestSort: (
        event: React.MouseEvent<unknown>,
        property: keyof Data,
    ) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
    const { classes, order, orderBy, onRequestSort } = props;
    const createSortHandler =
        (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property);
        };

    return (
        <TableHead>
            <TableRow className={classes.headerRow}>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                        className={classes.headerCell}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <span className={classes.visuallyHidden}>
                                    {order === 'desc'
                                        ? 'sorted descending'
                                        : 'sorted ascending'}
                                </span>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

export default function DataAcknowledgments(): JSX.Element {
    const classes = useStyles();
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Data>('country');
    const [selected, setSelected] = React.useState<string[]>([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);

    useEffect(() => {
        dispatch(fetchAcknowledgmentData());
    }, [dispatch]);

    const acknowledgmentDataForTable = useAppSelector(acknowledgmentData);

    const rows = [] as Data[];

    acknowledgmentDataForTable.map((el) => {
        rows.push(
            createData(
                el.name,
                el.origin.providerName ? el.origin.providerName[0] : 'N/A',
                el.origin.url,
                el.origin.license,
            ),
        );
        return {};
    });

    const handleRequestSort = (
        event: React.MouseEvent<unknown>,
        property: keyof Data,
    ) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
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

    const emptyRows =
        rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    const createHyperlink = (url: string) => {
        return (
            <a href={url} rel="noopener noreferrer">
                {url}
            </a>
        );
    };

    return (
        <>
            <Helmet>
                <title>Global.health | Data Acknowledment</title>
            </Helmet>
            {user ? (
                <div className={classes.root}>
                    <Typography variant="h1" className={classes.pageTitle}>
                        Data Acknowledments
                    </Typography>
                    <Typography
                        variant="body1"
                        className={classes.pageSubTitle}
                    >
                        We acknowledge the hard work and open-science of the
                        individual research labs and public health bodies that
                        have made epidemiological data available. A detailed
                        table of acknowledgements for the data used on this
                        platform is below.
                    </Typography>
                    <Paper className={classes.paper}>
                        <TableContainer>
                            <Table
                                className={classes.table}
                                aria-labelledby="tableTitle"
                                aria-label="enhanced table"
                            >
                                <EnhancedTableHead
                                    classes={classes}
                                    numSelected={selected.length}
                                    order={order}
                                    orderBy={orderBy}
                                    onRequestSort={handleRequestSort}
                                    rowCount={rows.length}
                                />
                                <TableBody>
                                    {stableSort(
                                        rows,
                                        getComparator(order, orderBy),
                                    )
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage,
                                        )
                                        .map((row, index) => {
                                            return (
                                                <TableRow
                                                    className={classes.tableRow}
                                                    hover
                                                    onClick={(event) =>
                                                        handleClick(
                                                            event,
                                                            row.dataContributor,
                                                        )
                                                    }
                                                    tabIndex={-1}
                                                    key={row.dataContributor}
                                                >
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        padding="normal"
                                                    >
                                                        {row.dataContributor}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {row.country}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {createHyperlink(
                                                            row.originDataSource,
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="left">
                                                        {row.license}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    {emptyRows > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[2, 4, 10]}
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
                    <Typography
                        variant="body1"
                        className={classes.pageSubTitle}
                    >
                        We acknowledge the hard work and open-science of the
                        individual research labs and public health bodies that
                        have made genome data accessible through GISAID*. Please
                        note that data coming from GISAID cannot be downloaded
                        through this platform.
                    </Typography>
                    <Divider className={classes.divider} />

                    <Typography variant="body2" className={classes.belowNote}>
                        * Elbe, S., and Buckland-Merrett, G. (2017) Data,
                        disease and diplomacy: GISAID’s innovative contribution
                        to global health. Global Challenges, 1:33-46. DOI:
                        10.1002/gch2.1018PMCID: 31565258 accessible via{' '}
                        <a href="https://pubmed.ncbi.nlm.nih.gov/31565258/">
                            https://pubmed.ncbi.nlm.nih.gov/31565258/
                        </a>
                    </Typography>
                </div>
            ) : (
                <></>
            )}
        </>
    );
}

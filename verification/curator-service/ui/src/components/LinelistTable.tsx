import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    Paper,
    TablePagination,
    Theme,
    Tooltip,
    Typography,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import { Case, VerificationStatus } from './Case';
import MaterialTable, { MTableToolbar, QueryResult } from 'material-table';
import React, { RefObject } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import FilterListIcon from '@material-ui/icons/FilterList';
import HelpIcon from '@material-ui/icons/HelpOutline';
import { Link } from 'react-router-dom';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MuiAlert from '@material-ui/lab/Alert';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';
import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import User from './User';
import VerificationStatusHeader from './VerificationStatusHeader';
import VerificationStatusIndicator from './VerificationStatusIndicator';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import fileDownload from 'js-file-download';
import renderDate from './util/date';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

interface LinelistTableState {
    url: string;
    error: string;
    pageSize: number;
    search: string;
    // The rows which are selected on the current page.
    selectedRowsCurrentPage: TableRow[];
    // The total number of rows selected. This can be larger than
    // selectedRowsCurrentPage.length if rows across all pages are selected.
    numSelectedRows: number;
    totalNumRows: number;
    deleteDialogOpen: boolean;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    confirmedDate: Date | null;
    adminArea3: string;
    adminArea2: string;
    adminArea1: string;
    country: string;
    age: [number, number]; // start, end.
    gender: string;
    outcome?: string;
    sourceUrl: string;
    verificationStatus?: VerificationStatus;
}

interface LocationState {
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
    searchQuery: string;
}

interface Props
    extends RouteComponentProps<never, never, LocationState>,
        WithStyles<typeof styles> {
    user: User;
}

const HtmlTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        maxWidth: '500px',
    },
}))(Tooltip);

const styles = (theme: Theme) =>
    createStyles({
        alert: {
            backgroundColor: 'white',
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(1),
        },
        centeredContent: {
            display: 'flex',
            justifyContent: 'center',
        },
        downloadButton: {
            marginLeft: theme.spacing(2),
            marginRight: theme.spacing(2),
        },
        spacer: { flex: 1 },
        paginationRoot: { border: 'unset' },
        tablePaginationBar: {
            alignItems: 'center',
            backgroundColor: '#ECF3F0',
            display: 'flex',
            height: '64px',
        },
        tableToolbar: {
            backgroundColor: '#31A497',
        },
        toolbarItems: {
            color: 'white',
        },
        topBar: {
            display: 'flex',
            alignItems: 'center',
        },
    });

const searchBarStyles = makeStyles((theme: Theme) => ({
    searchRoot: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        backgroundColor: '#0E7569',
        height: '40px',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        width: '1px',
    },
}));

const StyledSearchTextField = withStyles({
    root: {
        backgroundColor: 'white',
        borderRadius: '8px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
                border: '1px solid #0E7569',
            },
            '&.Mui-focused fieldset': {
                border: '1px solid #0E7569',
            },
        },
    },
})(TextField);

function SearchBar(props: {
    searchQuery: string;
    onSearchChange: (search: string) => void;
}): JSX.Element {
    const [search, setSearch] = React.useState<string>(props.searchQuery ?? '');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    React.useEffect(() => {
        setSearch(props.searchQuery ?? '');
    }, [props.searchQuery]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (): void => {
        setAnchorEl(null);
    };

    const clickItem = (text: string): void => {
        setSearch(search + (search ? ` ${text}:` : `${text}:`));
        handleClose();
    };

    const classes = searchBarStyles();
    return (
        <div className={classes.searchRoot}>
            <StyledSearchTextField
                id="search-field"
                onKeyPress={(ev): void => {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        props.onSearchChange(search);
                    }
                }}
                onChange={(event): void => {
                    setSearch(event.target.value);
                }}
                placeholder="Search"
                value={search}
                variant="outlined"
                fullWidth
                InputProps={{
                    margin: 'dense',
                    startAdornment: (
                        <InputAdornment position="start">
                            <Button
                                color="primary"
                                startIcon={<FilterListIcon />}
                                onClick={handleClick}
                            >
                                Filter
                            </Button>
                            <div className={classes.divider}></div>
                            <SearchIcon color="primary" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <HtmlTooltip
                                color="primary"
                                title={
                                    <React.Fragment>
                                        <h4>Search syntax</h4>
                                        <h5>Full text search</h5>
                                        Example:{' '}
                                        <i>"got infected at work" -India</i>
                                        <br />
                                        You can use arbitrary strings to search
                                        over those text fields:
                                        {[
                                            'notes',
                                            'curator',
                                            'occupation',
                                            'nationalities',
                                            'ethnicity',
                                            'country',
                                            'admin1',
                                            'admin2',
                                            'admin3',
                                            'place',
                                            'location name',
                                            'pathogen name',
                                            'source url',
                                            'upload ID',
                                        ].join(', ')}
                                        <h5>Keywords search</h5>
                                        Example:{' '}
                                        <i>
                                            curator:foo@bar.com,fez@meh.org
                                            country:Japan gender:female
                                            occupation:"healthcare worker"
                                        </i>
                                        <br />
                                        Values are OR'ed for the same keyword
                                        and all keywords are AND'ed.
                                        <br />
                                        Keyword values can be quoted for
                                        multi-words matches and concatenated
                                        with a comma to union them.
                                        <br />
                                        Only equality operator is supported.
                                        <br />
                                        Supported keywords are shown when the
                                        search bar is clicked.
                                    </React.Fragment>
                                }
                                placement="left"
                            >
                                <HelpIcon />
                            </HtmlTooltip>
                        </InputAdornment>
                    ),
                }}
            />
            <Menu
                anchorEl={anchorEl}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {[
                    'curator',
                    'gender',
                    'nationality',
                    'occupation',
                    'country',
                    'outcome',
                    'caseid',
                    'source',
                    'uploadid',
                    'admin1',
                    'admin2',
                    'admin3',
                ].map((text) => (
                    <MenuItem key={text} onClick={(): void => clickItem(text)}>
                        {text}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

const rowMenuStyles = makeStyles((theme: Theme) => ({
    menuItemTitle: {
        marginLeft: theme.spacing(1),
    },
}));

function RowMenu(props: {
    rowId: string;
    setError: (error: string) => void;
    refreshData: () => void;
}): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState<boolean>(
        false,
    );
    const classes = rowMenuStyles();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: any): void => {
        event?.stopPropagation();
        setAnchorEl(null);
    };

    const openDeleteDialog = async (event?: any): Promise<void> => {
        event?.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleDelete = async (event?: any): Promise<void> => {
        event?.stopPropagation();
        try {
            props.setError('');
            const deleteUrl = '/api/cases/' + props.rowId;
            await axios.delete(deleteUrl);
            props.refreshData();
        } catch (e) {
            props.setError(e.toString());
        } finally {
            setDeleteDialogOpen(false);
            handleClose();
        }
    };

    return (
        <>
            <IconButton
                aria-controls="topbar-menu"
                aria-haspopup="true"
                aria-label="row menu"
                data-testid="row menu"
                onClick={handleClick}
                color="inherit"
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <Link onClick={handleClose} to={`/cases/edit/${props.rowId}`}>
                    <MenuItem>
                        <EditIcon />
                        <span className={classes.menuItemTitle}>Edit</span>
                    </MenuItem>
                </Link>
                <MenuItem onClick={openDeleteDialog}>
                    <DeleteIcon />
                    <span className={classes.menuItemTitle}>Delete</span>
                </MenuItem>
            </Menu>
            <Dialog
                open={deleteDialogOpen}
                onClose={(): void => setDeleteDialogOpen(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
            >
                <DialogTitle>
                    Are you sure you want to delete this case?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Case {props.rowId} will be permanently deleted and can
                        not be recovered.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={(): void => {
                            setDeleteDialogOpen(false);
                        }}
                        color="primary"
                        autoFocus
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="primary">
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

class LinelistTable extends React.Component<Props, LinelistTableState> {
    tableRef: RefObject<any> = React.createRef();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unlisten: () => void = () => {};

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            pageSize: 50,
            search: this.props.location.state?.searchQuery ?? '',
            selectedRowsCurrentPage: [],
            numSelectedRows: 0,
            totalNumRows: 0,
            deleteDialogOpen: false,
        };
        this.deleteCases = this.deleteCases.bind(this);
        this.setCaseVerificationWithQuery = this.setCaseVerificationWithQuery.bind(
            this,
        );
        this.downloadCases = this.downloadCases.bind(this);
        this.downloadSelectedCases = this.downloadSelectedCases.bind(this);
    }

    componentDidMount(): void {
        // history.location.state can be updated with new values on which we
        // must refresh the table
        this.unlisten = this.props.history.listen((_, __) => {
            this.setState({
                search: this.props.history.location.state?.searchQuery ?? '',
            });
            this.tableRef.current?.onQueryChange();
        });
    }

    componentWillUnmount(): void {
        this.unlisten();
    }

    async deleteCases(): Promise<void> {
        let requestBody;
        if (this.hasSelectedRowsAcrossPages()) {
            requestBody = { data: { query: this.state.search } };
        } else {
            requestBody = {
                data: {
                    caseIds: this.state.selectedRowsCurrentPage.map(
                        (row: TableRow) => row.id,
                    ),
                },
            };
        }
        try {
            await axios.delete('/api/cases', requestBody);
            this.tableRef.current.onQueryChange();
        } catch (e) {
            this.setState({ error: e.toString() });
        } finally {
            this.setState({ deleteDialogOpen: false });
        }
    }

    hasSelectedRowsAcrossPages(): boolean {
        return (
            this.state.totalNumRows === this.state.numSelectedRows &&
            this.state.numSelectedRows > this.state.pageSize
        );
    }

    setCaseVerification(
        rowData: TableRow[],
        verificationStatus: VerificationStatus,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const updateUrl = this.state.url + 'batchUpdate';
            this.setState({ error: '' });
            const response = axios.post(updateUrl, {
                cases: rowData.map((row) => {
                    return {
                        _id: row.id,
                        'caseReference.verificationStatus': verificationStatus,
                    };
                }),
            });
            response.then(resolve).catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                reject(e);
            });
        });
    }

    setCaseVerificationWithQuery(
        verificationStatus: VerificationStatus,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const updateUrl = this.state.url + 'batchUpdateQuery';
            this.setState({ error: '' });
            const response = axios.post(updateUrl, {
                query: this.state.search,
                case: {
                    'caseReference.verificationStatus': verificationStatus,
                },
            });
            response.then(resolve).catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                reject(e);
            });
        });
    }

    downloadCases(): void {
        const requestBody = this.state.search.trim()
            ? { query: this.state.search }
            : {};
        this.setState({ error: '' });
        axios
            .post('/api/cases/download', requestBody)
            .then((response) => fileDownload(response.data, 'cases.csv'))
            .catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
            });
    }

    downloadSelectedCases(): void {
        let requestBody = {};
        if (this.hasSelectedRowsAcrossPages()) {
            requestBody = { query: this.state.search };
        } else {
            requestBody = {
                caseIds: this.state.selectedRowsCurrentPage.map(
                    (row: TableRow) => row.id,
                ),
            };
        }
        this.setState({ error: '' });
        axios
            .post('/api/cases/download', requestBody)
            .then((response) => fileDownload(response.data, 'cases.csv'))
            .catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
            });
    }

    render(): JSX.Element {
        const { history, classes } = this.props;
        return (
            <>
                {this.state.error && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="outlined"
                        severity="error"
                    >
                        {this.state.error}
                    </MuiAlert>
                )}
                {!this.props.location.state?.bulkMessage &&
                    this.props.location.state?.newCaseIds &&
                    this.props.location.state?.newCaseIds.length > 0 &&
                    (this.props.location.state.newCaseIds.length === 1 ? (
                        <MuiAlert
                            classes={{
                                root: classes.alert,
                            }}
                            variant="standard"
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.newCaseIds}`}
                                >
                                    <Button
                                        color="primary"
                                        size="small"
                                        data-testid="view-case-btn"
                                    >
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.newCaseIds} added`}
                        </MuiAlert>
                    ) : (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="standard"
                        >
                            {`${this.props.location.state.newCaseIds.length} cases added`}
                        </MuiAlert>
                    ))}
                {!this.props.location.state?.bulkMessage &&
                    (this.props.location.state?.editedCaseIds?.length ?? 0) >
                        0 && (
                        <MuiAlert
                            variant="standard"
                            classes={{ root: classes.alert }}
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.editedCaseIds}`}
                                >
                                    <Button color="primary" size="small">
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.editedCaseIds} edited`}
                        </MuiAlert>
                    )}
                {this.props.location.state?.bulkMessage && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="standard"
                    >
                        {this.props.location.state.bulkMessage}
                    </MuiAlert>
                )}
                <div className={classes.topBar}>
                    <SearchBar
                        searchQuery={this.state.search}
                        onSearchChange={(search: string): void => {
                            this.setState({ search: search });
                            this.tableRef.current.onQueryChange();
                        }}
                    ></SearchBar>
                    <Button
                        className={classes.downloadButton}
                        variant="outlined"
                        color="primary"
                        onClick={this.downloadCases}
                        startIcon={<SaveAltIcon />}
                    >
                        Download
                    </Button>
                </div>
                <Dialog
                    open={this.state.deleteDialogOpen}
                    onClose={(): void =>
                        this.setState({ deleteDialogOpen: false })
                    }
                    // Stops the click being propagated to the table which
                    // would trigger the onRowClick action.
                    onClick={(e): void => e.stopPropagation()}
                >
                    <DialogTitle>
                        Are you sure you want to delete{' '}
                        {this.state.numSelectedRows === 1
                            ? '1 case'
                            : `${this.state.numSelectedRows} cases`}
                        ?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.state.numSelectedRows === 1
                                ? '1 case'
                                : `${this.state.numSelectedRows} cases`}{' '}
                            will be permanently deleted and can not be
                            recovered.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={(): void => {
                                this.setState({ deleteDialogOpen: false });
                            }}
                            color="primary"
                            autoFocus
                        >
                            Cancel
                        </Button>
                        <Button onClick={this.deleteCases} color="primary">
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        ...(this.props.user.roles.includes('curator')
                            ? [
                                  // TODO: move to the left of selection checkboxes when possible
                                  // https://github.com/mbrn/material-table/issues/2317
                                  {
                                      cellStyle: {
                                          padding: '0',
                                      },
                                      render: (
                                          rowData: TableRow,
                                      ): JSX.Element => (
                                          <RowMenu
                                              rowId={rowData.id}
                                              refreshData={(): void =>
                                                  this.tableRef.current.onQueryChange()
                                              }
                                              setError={(error): void =>
                                                  this.setState({
                                                      error: error,
                                                  })
                                              }
                                          ></RowMenu>
                                      ),
                                  },
                              ]
                            : []),
                        {
                            cellStyle: {
                                padding: '0',
                            },
                            headerStyle: {
                                padding: '0',
                            },
                            title: (
                                <div className={classes.centeredContent}>
                                    <VerificationStatusHeader />
                                </div>
                            ),
                            field: 'verificationStatus',
                            // The return type in the material-table dts is any.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            render: (rowData): any => {
                                return (
                                    <div className={classes.centeredContent}>
                                        <VerificationStatusIndicator
                                            status={rowData.verificationStatus}
                                        />
                                    </div>
                                );
                            },
                        },
                        {
                            title: 'Case ID',
                            field: 'id',
                            type: 'string',
                        },
                        {
                            title: 'Confirmed date',
                            field: 'confirmedDate',
                            render: (rowData): string =>
                                renderDate(rowData.confirmedDate),
                        },
                        {
                            title: 'Admin 3',
                            field: 'adminArea3',
                        },
                        {
                            title: 'Admin 2',
                            field: 'adminArea2',
                        },
                        {
                            title: 'Admin 1',
                            field: 'adminArea1',
                        },
                        {
                            title: 'Country',
                            field: 'country',
                        },
                        {
                            title: 'Age',
                            field: 'age',
                            render: (rowData) =>
                                rowData.age[0] === rowData.age[1]
                                    ? rowData.age[0]
                                    : `${rowData.age[0]}-${rowData.age[1]}`,
                        },
                        {
                            title: 'Gender',
                            field: 'gender',
                        },
                        {
                            title: 'Outcome',
                            field: 'outcome',
                        },
                        {
                            title: 'Source URL',
                            field: 'sourceUrl',
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const trimmedQ = this.state.search.trim();
                            if (trimmedQ) {
                                listUrl += '&q=' + encodeURIComponent(trimmedQ);
                            }
                            this.setState({ error: '' });
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedCases: TableRow[] = [];
                                    const cases = result.data.cases;
                                    for (const c of cases) {
                                        const confirmedEvent = c.events.find(
                                            (event) =>
                                                event.name === 'confirmed',
                                        );
                                        flattenedCases.push({
                                            id: c._id,
                                            confirmedDate: confirmedEvent
                                                ?.dateRange?.start
                                                ? new Date(
                                                      confirmedEvent.dateRange.start,
                                                  )
                                                : null,
                                            adminArea3:
                                                c.location
                                                    ?.administrativeAreaLevel3,
                                            adminArea2:
                                                c.location
                                                    ?.administrativeAreaLevel2,
                                            adminArea1:
                                                c.location
                                                    ?.administrativeAreaLevel1,
                                            country: c.location.country,
                                            age: [
                                                c.demographics?.ageRange?.start,
                                                c.demographics?.ageRange?.end,
                                            ],
                                            gender: c.demographics?.gender,
                                            outcome: c.events.find(
                                                (event) =>
                                                    event.name === 'outcome',
                                            )?.value,
                                            sourceUrl:
                                                c.caseReference?.sourceUrl,
                                            verificationStatus:
                                                c.caseReference
                                                    ?.verificationStatus,
                                        });
                                    }
                                    this.setState({
                                        totalNumRows: result.data.total,
                                        selectedRowsCurrentPage: [],
                                        numSelectedRows: 0,
                                    });
                                    resolve({
                                        data: flattenedCases,
                                        page: query.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
                                    this.setState({
                                        error:
                                            e.response?.data?.message ||
                                            e.toString(),
                                    });
                                    reject(e);
                                });
                        })
                    }
                    components={{
                        Container: (props): JSX.Element => (
                            <Paper elevation={0} {...props}></Paper>
                        ),
                        Pagination: (props): JSX.Element => {
                            return this.state.numSelectedRows === 0 ? (
                                <div className={classes.tablePaginationBar}>
                                    <Typography>Linelist</Typography>
                                    <span className={classes.spacer}></span>
                                    <TablePagination
                                        {...props}
                                        classes={{
                                            ...props.classes,
                                            root: classes.paginationRoot,
                                        }}
                                    ></TablePagination>
                                </div>
                            ) : (
                                <></>
                            );
                        },
                        Toolbar: (props): JSX.Element => (
                            <MTableToolbar
                                {...props}
                                classes={{
                                    highlight: classes.tableToolbar,
                                    title: classes.toolbarItems,
                                }}
                                toolbarButtonAlignment="left"
                            />
                        ),
                    }}
                    onSelectionChange={(rows): void =>
                        this.setState({
                            selectedRowsCurrentPage: rows,
                            numSelectedRows: rows.length,
                        })
                    }
                    localization={{
                        toolbar: {
                            nRowsSelected:
                                this.state.numSelectedRows === 1
                                    ? '1 row selected'
                                    : `${this.state.numSelectedRows} rows selected`,
                        },
                    }}
                    options={{
                        search: false,
                        emptyRowsWhenPaging: false,
                        filtering: false,
                        sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        selection:
                            this.props.user.roles.includes('curator') ||
                            this.props.user.roles.includes('admin'),
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'top',
                        toolbar: this.state.numSelectedRows > 0,
                        maxBodyHeight: 'calc(100vh - 20em)',
                        headerStyle: {
                            zIndex: 1,
                        },
                        // TODO: style highlighted rows to spec
                        rowStyle: (rowData) =>
                            (
                                this.props.location.state?.newCaseIds ?? []
                            ).includes(rowData.id) ||
                            (
                                this.props.location.state?.editedCaseIds ?? []
                            ).includes(rowData.id)
                                ? { backgroundColor: '#F0FBF9' }
                                : {},
                    }}
                    onChangeRowsPerPage={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                    onRowClick={(_, rowData?: TableRow): void => {
                        if (rowData) {
                            history.push(`/cases/view/${rowData.id}`);
                        }
                    }}
                    actions={
                        this.props.user.roles.includes('curator') ||
                        this.props.user.roles.includes('admin')
                            ? [
                                  // Only allow selecting rows across pages if
                                  // there is a search query.
                                  ...(this.state.search.trim() !== ''
                                      ? [
                                            {
                                                icon: (): JSX.Element => (
                                                    <Button
                                                        classes={{
                                                            root:
                                                                classes.toolbarItems,
                                                        }}
                                                    >
                                                        {this.state
                                                            .totalNumRows ===
                                                        this.state
                                                            .numSelectedRows
                                                            ? 'Unselect'
                                                            : 'Select'}{' '}
                                                        all{' '}
                                                        {
                                                            this.state
                                                                .totalNumRows
                                                        }{' '}
                                                        rows
                                                    </Button>
                                                ),
                                                tooltip: `
                                      ${
                                          this.state.totalNumRows ===
                                          this.state.numSelectedRows
                                              ? 'Unselect'
                                              : 'Select'
                                      } all rows across pages`,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onClick: async (
                                                    _: any,
                                                    rows: any,
                                                ): Promise<void> => {
                                                    const shouldSelectAll =
                                                        this.state
                                                            .totalNumRows !==
                                                        this.state
                                                            .numSelectedRows;
                                                    await this.tableRef.current.onAllSelected(
                                                        shouldSelectAll,
                                                    );
                                                    this.setState({
                                                        numSelectedRows: shouldSelectAll
                                                            ? this.state
                                                                  .totalNumRows
                                                            : 0,
                                                    });
                                                },
                                            },
                                        ]
                                      : []),
                                  {
                                      icon: (): JSX.Element => (
                                          <VerifiedIcon data-testid="verify-action" />
                                      ),
                                      hidden: !this.props.user.roles.includes(
                                          'curator',
                                      ),
                                      tooltip: 'Verify selected rows',
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      onClick: async (
                                          _: any,
                                          rows: any,
                                      ): Promise<void> => {
                                          if (
                                              this.hasSelectedRowsAcrossPages()
                                          ) {
                                              await this.setCaseVerificationWithQuery(
                                                  VerificationStatus.Verified,
                                              );
                                          } else {
                                              await this.setCaseVerification(
                                                  rows,
                                                  VerificationStatus.Verified,
                                              );
                                          }
                                          this.tableRef.current.onQueryChange();
                                      },
                                  },
                                  {
                                      icon: (): JSX.Element => (
                                          <UnverifiedIcon data-testid="unverify-action" />
                                      ),
                                      hidden: !this.props.user.roles.includes(
                                          'curator',
                                      ),
                                      tooltip: 'Unverify selected rows',
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      onClick: async (
                                          _: any,
                                          rows: any,
                                      ): Promise<void> => {
                                          if (
                                              this.hasSelectedRowsAcrossPages()
                                          ) {
                                              await this.setCaseVerificationWithQuery(
                                                  VerificationStatus.Unverified,
                                              );
                                          } else {
                                              await this.setCaseVerification(
                                                  rows,
                                                  VerificationStatus.Unverified,
                                              );
                                          }
                                          this.tableRef.current.onQueryChange();
                                      },
                                  },
                                  {
                                      icon: (): JSX.Element => (
                                          <span aria-label="download selected rows">
                                              <SaveAltIcon
                                                  classes={{
                                                      root:
                                                          classes.toolbarItems,
                                                  }}
                                              />
                                          </span>
                                      ),
                                      tooltip: 'Download selected rows',
                                      onClick: (): void => {
                                          this.downloadSelectedCases();
                                      },
                                  },
                                  // This action is for deleting selected rows.
                                  // The action for deleting single rows is in the
                                  // RowMenu function.
                                  {
                                      icon: (): JSX.Element => (
                                          <span aria-label="delete all">
                                              <DeleteIcon
                                                  classes={{
                                                      root:
                                                          classes.toolbarItems,
                                                  }}
                                              />
                                          </span>
                                      ),
                                      tooltip: 'Delete selected rows',
                                      onClick: (): void => {
                                          this.setState({
                                              deleteDialogOpen: true,
                                          });
                                      },
                                  },
                              ]
                            : []
                    }
                />
            </>
        );
    }
}

export default withRouter(withStyles(styles)(LinelistTable));

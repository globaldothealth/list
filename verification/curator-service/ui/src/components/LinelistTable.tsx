import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    TablePagination,
    Theme,
    Typography,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import { Case, VerificationStatus } from './Case';
import MaterialTable, { MTableToolbar, QueryResult } from 'material-table';
import React, { RefObject } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import CircularProgress from '@material-ui/core/CircularProgress';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import { Link } from 'react-router-dom';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MuiAlert from '@material-ui/lab/Alert';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import User from './User';
import VerificationStatusHeader from './VerificationStatusHeader';
import VerificationStatusIndicator from './VerificationStatusIndicator';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import renderDate, { renderDateRange } from './util/date';
import { round } from 'lodash';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

interface LinelistTableState {
    url: string;
    error: string;
    pageSize: number;
    // The rows which are selected on the current page.
    selectedRowsCurrentPage: TableRow[];
    // The total number of rows selected. This can be larger than
    // selectedRowsCurrentPage.length if rows across all pages are selected.
    numSelectedRows: number;
    totalNumRows: number;
    deleteDialogOpen: boolean;
    isLoading: boolean;
    isDeleting: boolean;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    confirmedDate: Date | null;
    adminArea3: string;
    adminArea2: string;
    adminArea1: string;
    country: string;
    latitude: number;
    longitude: number;
    age: [number, number]; // start, end.
    gender: string;
    outcome?: string;
    hospitalizationDateRange?: string;
    symptomsOnsetDate?: string;
    sourceUrl: string;
    verificationStatus?: VerificationStatus;
}

interface LocationState {
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
    search: string;
}

interface Props
    extends RouteComponentProps<never, never, LocationState>,
        WithStyles<typeof styles> {
    user: User;
    setSearchLoading: (a: boolean) => void;
}

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
        dialogLoadingSpinner: {
            marginRight: theme.spacing(2),
            padding: '6px',
        },
        spacer: { flex: 1 },
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
    });

const rowMenuStyles = makeStyles((theme: Theme) => ({
    menuItemTitle: {
        marginLeft: theme.spacing(1),
    },
    dialogLoadingSpinner: {
        marginRight: theme.spacing(2),
        padding: '6px',
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
    const [isDeleting, setIsDeleting] = React.useState(false);
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
            setIsDeleting(true);
            props.setError('');
            const deleteUrl = '/api/cases/' + props.rowId;
            await axios.delete(deleteUrl);
            props.refreshData();
        } catch (e) {
            props.setError(e.toString());
        } finally {
            setDeleteDialogOpen(false);
            setIsDeleting(false);
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
                        Case {props.rowId} will be permanently deleted.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {isDeleting ? (
                        <CircularProgress
                            classes={{ root: classes.dialogLoadingSpinner }}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}

export function DownloadButton(props: { search: string }): JSX.Element {
    const formRef: RefObject<any> = React.createRef();

    return (
        <>
            <form
                hidden
                ref={formRef}
                method="POST"
                action="/api/cases/download"
            >
                <input name="query" value={props.search.trim()} />
            </form>
            <Button
                variant="outlined"
                color="primary"
                onClick={(): void => formRef.current.submit()}
                startIcon={<SaveAltIcon />}
            >
                Download
            </Button>
        </>
    );
}

class LinelistTable extends React.Component<Props, LinelistTableState> {
    maxDeletionThreshold = 10000;
    tableRef: RefObject<any> = React.createRef();
    formRef: RefObject<any> = React.createRef();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unlisten: () => void = () => {};

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            pageSize: 50,
            selectedRowsCurrentPage: [],
            numSelectedRows: 0,
            totalNumRows: 0,
            deleteDialogOpen: false,
            isLoading: false,
            isDeleting: false,
        };
        this.deleteCases = this.deleteCases.bind(this);
        this.setCaseVerificationWithQuery = this.setCaseVerificationWithQuery.bind(
            this,
        );
        this.confirmationDialogTitle = this.confirmationDialogTitle.bind(this);
        this.confirmationDialogBody = this.confirmationDialogBody.bind(this);
        this.showConfirmationDialogError = this.showConfirmationDialogError.bind(
            this,
        );
    }

    componentDidMount(): void {
        // history.location.state can be updated with new values on which we
        // must refresh the table
        this.unlisten = this.props.history.listen((_, __) => {
            this.tableRef.current?.onQueryChange();
        });
    }

    componentWillUnmount(): void {
        this.unlisten();
    }

    async deleteCases(): Promise<void> {
        this.setState({ error: '', isDeleting: true });
        let requestBody;
        if (this.hasSelectedRowsAcrossPages()) {
            requestBody = { data: { query: this.props.location.state.search } };
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
            this.setState({ deleteDialogOpen: false, isDeleting: false });
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
            this.setState({ error: '', isLoading: true });
            const response = axios.post(updateUrl, {
                cases: rowData.map((row) => {
                    return {
                        _id: row.id,
                        'caseReference.verificationStatus': verificationStatus,
                    };
                }),
            });
            response
                .then(() => {
                    this.setState({ isLoading: false });
                    resolve();
                })
                .catch((e) => {
                    this.setState({
                        error: e.response?.data?.message || e.toString(),
                        isLoading: false,
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
            this.setState({ error: '', isLoading: true });
            const response = axios.post(updateUrl, {
                query: this.props.location.state.search,
                case: {
                    'caseReference.verificationStatus': verificationStatus,
                },
            });
            response
                .then(() => {
                    this.setState({ isLoading: false });
                    resolve();
                })
                .catch((e) => {
                    this.setState({
                        error: e.response?.data?.message || e.toString(),
                        isLoading: false,
                    });
                    reject(e);
                });
        });
    }

    confirmationDialogTitle(): string {
        if (this.showConfirmationDialogError()) {
            return 'Error';
        }
        return (
            'Are you sure you want to delete ' +
            (this.state.numSelectedRows === 1
                ? '1 case'
                : `${this.state.numSelectedRows} cases`) +
            '?'
        );
    }

    confirmationDialogBody(): string {
        if (this.showConfirmationDialogError()) {
            return (
                `${this.state.numSelectedRows} cases selected to delete which is greater than the allowed maximum of ${this.maxDeletionThreshold}.` +
                ' An admin can perform the deletion if it is valid.'
            );
        }
        return (
            (this.state.numSelectedRows === 1
                ? '1 case'
                : `${this.state.numSelectedRows} cases`) +
            ' will be permanently deleted.'
        );
    }

    showConfirmationDialogError(): boolean {
        return (
            !this.props.user.roles.includes('admin') &&
            this.state.numSelectedRows > this.maxDeletionThreshold
        );
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
                <Dialog
                    open={this.state.deleteDialogOpen}
                    onClose={(): void =>
                        this.setState({ deleteDialogOpen: false })
                    }
                    // Stops the click being propagated to the table which
                    // would trigger the onRowClick action.
                    onClick={(e): void => e.stopPropagation()}
                >
                    <DialogTitle>{this.confirmationDialogTitle()}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.confirmationDialogBody()}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        {this.state.isDeleting ? (
                            <CircularProgress
                                classes={{ root: classes.dialogLoadingSpinner }}
                            />
                        ) : (
                            <>
                                <Button
                                    onClick={(): void => {
                                        this.setState({
                                            deleteDialogOpen: false,
                                        });
                                    }}
                                    color="primary"
                                    autoFocus
                                >
                                    Cancel
                                </Button>
                                {!this.showConfirmationDialogError() && (
                                    <Button
                                        onClick={this.deleteCases}
                                        color="primary"
                                    >
                                        Yes
                                    </Button>
                                )}
                            </>
                        )}
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
                            headerStyle: { whiteSpace: 'nowrap' },
                            cellStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: 'Admin 3',
                            field: 'adminArea3',
                            headerStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: 'Admin 2',
                            field: 'adminArea2',
                            headerStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: 'Admin 1',
                            field: 'adminArea1',
                            headerStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: 'Country',
                            field: 'country',
                        },
                        {
                            title: 'Latitude',
                            field: 'latitude',
                        },
                        {
                            title: 'Longitude',
                            field: 'longitude',
                        },
                        {
                            title: 'Age',
                            field: 'age',
                            render: (rowData) =>
                                rowData.age[0] === rowData.age[1]
                                    ? rowData.age[0]
                                    : `${rowData.age[0]}-${rowData.age[1]}`,
                            cellStyle: { whiteSpace: 'nowrap' },
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
                            title: 'Hospitalization date/period',
                            field: 'hospitalizationDateRange',
                        },
                        {
                            title: 'Symptoms onset date',
                            field: 'symptomsOnsetDate',
                        },
                        {
                            title: 'Source URL',
                            field: 'sourceUrl',
                            headerStyle: { whiteSpace: 'nowrap' },
                        },
                    ]}
                    isLoading={this.state.isLoading}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const trimmedQ = this.props.location.state?.search?.trim();
                            if (trimmedQ) {
                                listUrl += '&q=' + encodeURIComponent(trimmedQ);
                            }
                            this.setState({ isLoading: true, error: '' });
                            this.props.setSearchLoading(true);
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
                                            latitude: round(
                                                c.location?.geometry?.latitude,
                                                4,
                                            ),
                                            longitude: round(
                                                c.location?.geometry?.longitude,
                                                4,
                                            ),
                                            age: [
                                                c.demographics?.ageRange?.start,
                                                c.demographics?.ageRange?.end,
                                            ],
                                            gender: c.demographics?.gender,
                                            outcome: c.events.find(
                                                (event) =>
                                                    event.name === 'outcome',
                                            )?.value,
                                            hospitalizationDateRange: renderDateRange(
                                                c.events.find(
                                                    (event) =>
                                                        event.name ===
                                                        'hospitalAdmission',
                                                )?.dateRange,
                                            ),
                                            symptomsOnsetDate: renderDateRange(
                                                c.events.find(
                                                    (event) =>
                                                        event.name ===
                                                        'onsetSymptoms',
                                                )?.dateRange,
                                            ),
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
                                })
                                .finally(() => {
                                    this.setState({ isLoading: false });
                                    this.props.setSearchLoading(false);
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
                    style={{ fontFamily: 'Inter' }}
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
                                  ...((this.props.location.state?.search?.trim() ??
                                      '') !== ''
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
                                              <form
                                                  hidden
                                                  ref={this.formRef}
                                                  method="POST"
                                                  action="/api/cases/download"
                                              >
                                                  {this.state.selectedRowsCurrentPage.map(
                                                      (row: TableRow) => (
                                                          <input
                                                              name="caseIds[]"
                                                              key={row.id}
                                                              value={row.id}
                                                          />
                                                      ),
                                                  )}
                                              </form>
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
                                          this.formRef.current.submit();
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

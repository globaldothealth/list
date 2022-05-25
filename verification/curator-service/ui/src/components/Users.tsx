import MaterialTable, { QueryResult } from 'material-table';
import {
    Avatar,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Menu,
    Paper,
    TablePagination,
    Typography,
} from '@material-ui/core';
import React, { RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../redux/store';
import {
    Theme,
    WithStyles,
    createStyles,
    withStyles,
    makeStyles,
} from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import MuiAlert from '@material-ui/lab/Alert';
import Select from '@material-ui/core/Select';
import User from './User';
import axios from 'axios';

const mapStateToProps = (state: RootState) => ({
    user: state.auth.user,
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface UsersState {
    availableRoles: string[];
    url: string;
    error: string;
    pageSize: number;
}

interface TableRow {
    id: string;
    picture: string;
    name: string;
    email: string;
    roles: string[];
}

interface Props extends PropsFromRedux, WithStyles<typeof styles> {
    onUserChange: () => void;
}

interface UsersSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-testid'?: string;
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        alert: {
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(2),
        },
        spacer: { flex: 1 },
        tablePaginationBar: {
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            height: '64px',
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
    rowData: TableRow;
    setError: (error: string) => void;
    refreshData: () => void;
}): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        React.useState<boolean>(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const classes = rowMenuStyles();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClose = (event?: any): void => {
        if (event) {
            event.stopPropagation();
        }
        setAnchorEl(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openDeleteDialog = (event?: any): void => {
        if (event) {
            event.stopPropagation();
        }
        setDeleteDialogOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDelete = async (event?: any): Promise<void> => {
        if (event) {
            event.stopPropagation();
        }
        try {
            setIsDeleting(true);
            props.setError('');
            const deleteUrl = '/api/users/' + props.rowId;
            await axios.delete(deleteUrl);
            props.refreshData();
        } catch (e) {
            props.setError((e as Error).toString());
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
                    Are you sure you want to delete this user?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        User {props.rowData.email} will be permanently deleted.
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

class Users extends React.Component<Props, UsersState> {
    // We could use a proper type here but then we wouldn't be able to call
    // onQueryChange() to refresh the table as we want.
    // https://github.com/mbrn/material-table/issues/1752
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableRef: RefObject<any> = React.createRef();
    constructor(props: Props) {
        super(props);
        this.state = {
            availableRoles: [],
            url: '/api/users/',
            error: '',
            pageSize: 10,
        };
    }

    componentDidMount(): void {
        axios
            .get(this.state.url + 'roles')
            .then((resp) => {
                this.setState({ availableRoles: resp.data.roles });
            })
            .catch((e) => {
                this.setState({ availableRoles: [] });
                console.error(e);
            });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Paper>
                {this.state.error && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="filled"
                        severity="error"
                    >
                        {this.state.error}
                    </MuiAlert>
                )}
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        ...((this.props.user?.roles ?? []).includes('admin')
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
                                              rowData={rowData}
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
                            title: 'id',
                            field: 'id',
                            hidden: true,
                        },
                        {
                            title: 'Picture',
                            field: 'picture',
                            editable: 'never',
                            render: (rowData): JSX.Element => (
                                <Avatar src={rowData.picture} alt="avatar" />
                            ),
                            width: '3em',
                        },
                        {
                            title: 'Name',
                            field: 'name',
                            type: 'string',
                        },
                        {
                            title: 'Email',
                            field: 'email',
                            type: 'string',
                        },
                        {
                            title: 'Roles',
                            field: 'roles',
                            type: 'string',
                            render: (rowData): JSX.Element =>
                                this.rolesFormControl(rowData),
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            this.setState({ error: '' });
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedUsers: TableRow[] = [];
                                    for (const c of result.data.users) {
                                        flattenedUsers.push({
                                            id: c._id,
                                            name: c.name || 'Name not provided',
                                            email: c.email,
                                            roles: c.roles,
                                            picture: c.picture || '',
                                        });
                                    }
                                    resolve({
                                        data: flattenedUsers,
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
                            return (
                                <div className={classes.tablePaginationBar}>
                                    <Typography>Users</Typography>
                                    <span className={classes.spacer}></span>
                                    <TablePagination
                                        {...props}
                                    ></TablePagination>
                                </div>
                            );
                        },
                    }}
                    style={{ fontFamily: 'Inter' }}
                    options={{
                        search: false,
                        filtering: false,
                        sorting: false,
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'top',
                        toolbar: false,
                        headerStyle: {
                            zIndex: 1,
                        },
                    }}
                    onChangeRowsPerPage={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                />
            </Paper>
        );
    }

    updateRoles(
        event: React.ChangeEvent<{ value: string[] }>,
        userId: string,
    ): void {
        axios
            .put(this.state.url + userId, {
                roles: event.target.value,
            })
            .then(() => {
                if (this.props.user && userId === this.props.user._id) {
                    this.props.onUserChange();
                }
                if (this.tableRef?.current) {
                    this.tableRef.current.onQueryChange();
                }
            })
            .catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                console.error(e);
            });
    }

    rolesFormControl(rowData: TableRow): JSX.Element {
        return (
            <FormControl>
                <Select
                    data-testid={`${rowData.name}-select-roles`}
                    SelectDisplayProps={
                        {
                            'data-testid': `${rowData.name}-select-roles-button`,
                        } as UsersSelectDisplayProps
                    }
                    multiple
                    value={rowData.roles}
                    onChange={(event) =>
                        this.updateRoles(
                            event as React.ChangeEvent<{
                                value: string[];
                            }>,
                            rowData.id,
                        )
                    }
                    renderValue={(selected) =>
                        (selected as string[]).sort().join(', ')
                    }
                >
                    {this.state.availableRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                            {role}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }
}

export default connector(withStyles(styles, { withTheme: true })(Users));

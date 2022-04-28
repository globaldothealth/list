import MaterialTable, { QueryResult } from 'material-table';
import { Avatar, Paper, TablePagination, Typography } from '@mui/material';
import React, { useRef, useState, useEffect } from 'react';
import { Theme } from '@mui/material/styles';
import { useAppSelector } from '../hooks/redux';
import { selectUser } from '../redux/auth/selectors';

import makeStyles from '@mui/styles/makeStyles';

import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import MuiAlert from '@mui/material/Alert';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import User from './User';
import axios from 'axios';

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface TableRow {
    id: string;
    picture: string;
    name: string;
    email: string;
    roles: string[];
}

interface UsersProps {
    onUserChange: () => void;
}

interface UsersSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-testid'?: string;
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useStyles = makeStyles((theme: Theme) => ({
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
}));

const Users = ({ onUserChange }: UsersProps) => {
    // We could use a proper type here but then we wouldn't be able to call
    // onQueryChange() to refresh the table as we want.
    // https://github.com/mbrn/material-table/issues/1752
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableRef = useRef<any>();
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [url] = useState('/api/users/');
    const [error, setError] = useState('');
    const [pageSize, setPageSize] = useState(10);

    const user = useAppSelector(selectUser);

    const classes = useStyles();

    useEffect(() => {
        axios
            .get(url + 'roles')
            .then((resp) => {
                setAvailableRoles(resp.data.roles);
            })
            .catch((e) => {
                setAvailableRoles([]);
                console.error(e);
            });
    }, [url]);

    const updateRoles = (
        event: SelectChangeEvent<string[]>,
        userId: string,
    ): void => {
        axios
            .put(url + userId, {
                roles: event.target.value,
            })
            .then(() => {
                if (user && userId === user._id) {
                    onUserChange();
                }
                if (tableRef?.current) {
                    tableRef.current.onQueryChange();
                }
            })
            .catch((e) => {
                setError(e.response?.data?.message || e.toString());
                console.error(e);
            });
    };

    const rolesFormControl = (rowData: TableRow): JSX.Element => {
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
                    onChange={(event) => updateRoles(event, rowData.id)}
                    renderValue={(selected) =>
                        (selected as string[]).sort().join(', ')
                    }
                >
                    {availableRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                            {role}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    };

    return (
        <Paper>
            {error && (
                <MuiAlert
                    classes={{ root: classes.alert }}
                    variant="filled"
                    severity="error"
                >
                    {error}
                </MuiAlert>
            )}
            <MaterialTable
                tableRef={tableRef}
                columns={[
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
                            rolesFormControl(rowData),
                    },
                ]}
                data={(query): Promise<QueryResult<TableRow>> =>
                    new Promise((resolve, reject) => {
                        let listUrl = url;
                        listUrl += '?limit=' + pageSize;
                        listUrl += '&page=' + (query.page + 1);
                        setError('');
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
                                setError(
                                    e.response?.data?.message || e.toString(),
                                );
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
                                <TablePagination {...props}></TablePagination>
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
                    pageSize: pageSize,
                    pageSizeOptions: [5, 10, 20, 50, 100],
                    paginationPosition: 'top',
                    toolbar: false,
                    headerStyle: {
                        zIndex: 1,
                    },
                }}
                onChangeRowsPerPage={(newPageSize: number) => {
                    setPageSize(newPageSize);
                    tableRef.current.onQueryChange();
                }}
            />
        </Paper>
    );
};

export default Users;

import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';

import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import MuiAlert from '@material-ui/lab/Alert';
import { Paper } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import User from './User';
import axios from 'axios';

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
    name: string;
    email: string;
    roles: string[];
}

interface Props {
    user: User;
    onUserChange: () => void;
}

interface UsersSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-testid'?: string;
}

export default class Users extends React.Component<Props, UsersState> {
    // We could use a proper type here but then we wouldn't be able to call
    // onQueryChange() to refresh the table as we want.
    // https://github.com/mbrn/material-table/issues/1752
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
        return (
            <Paper>
                {this.state.error && (
                    <MuiAlert elevation={6} variant="filled" severity="error">
                        {this.state.error}
                    </MuiAlert>
                )}
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        {
                            title: 'id',
                            field: 'id',
                            hidden: true,
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
                                        });
                                    }
                                    resolve({
                                        data: flattenedUsers,
                                        page: query.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
                                    this.setState({ error: JSON.stringify(e) });
                                    reject(e);
                                });
                        })
                    }
                    title="Users"
                    options={{
                        search: false,
                        filtering: false,
                        sorting: false,
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
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
                if (userId === this.props.user._id) {
                    this.props.onUserChange();
                }
                if (this.tableRef?.current) {
                    this.tableRef.current.onQueryChange();
                }
            })
            .catch((e) => {
                this.setState({ error: JSON.stringify(e) });
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

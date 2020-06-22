import { WithStyles, createStyles, withStyles } from '@material-ui/core';

import Chip from '@material-ui/core/Chip';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import Select from '@material-ui/core/Select';
import axios from 'axios';

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

interface UsersState {
    users: User[];
    availableRoles: string[];
    url: string;
}

const styles = () =>
    createStyles({
        table: {
            width: '100%',
        },
        headerCell: {
            height: '3.5em',
            textAlign: 'start',
            width: '50%',
        },
        cell: {
            fontWeight: 'normal',
            height: '3.5em',
            textAlign: 'start',
            width: '50%',
        },
        chip: {
            margin: 2,
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles> {
    user: User;
    onUserChange: () => void;
}

interface UsersSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-testid'?: string;
}

class Users extends React.Component<Props, UsersState> {
    constructor(props: Props) {
        super(props);
        this.state = { users: [], availableRoles: [], url: '/api/users/' };
    }

    componentDidMount(): void {
        // TODO: add UI for paging through users
        axios
            .get<ListResponse>(this.state.url + '?limit=50')
            .then((resp) => {
                this.setState({ users: resp.data.users });
            })
            .catch((e) => {
                this.setState({ users: [] });
                console.error(e);
            });
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

    updateRoles(
        event: React.ChangeEvent<{ value: string[] }>,
        updatedUser: User,
    ): void {
        axios
            .put(this.state.url + updatedUser._id, {
                roles: event.target.value,
            })
            .then(() => {
                const updatedUsers = this.state.users.slice();
                (updatedUsers.find(
                    (user: User) => user._id === updatedUser._id,
                ) as User).roles = event.target.value;
                this.setState({ users: updatedUsers });
                if (updatedUser._id === this.props.user._id) {
                    this.props.onUserChange();
                }
            })
            .catch((e) => {
                console.error(e);
            });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th className={classes.headerCell}>Name</th>
                            <th className={classes.headerCell}>Email</th>
                            <th className={classes.headerCell}>Roles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.users.map((user) => (
                            <tr key={user._id}>
                                <th
                                    className={classes.cell}
                                    data-testid={user.name}
                                >
                                    {user.name || 'Name not provided'}
                                </th>
                                <th
                                    className={classes.cell}
                                    data-testid={user.email}
                                >
                                    {user.email}
                                </th>
                                <th
                                    className={classes.cell}
                                    data-testid={`${user.name}-roles`}
                                >
                                    <FormControl>
                                        <Select
                                            data-testid={`${user.name}-select-roles`}
                                            SelectDisplayProps={
                                                {
                                                    'data-testid': `${user.name}-select-roles-button`,
                                                } as UsersSelectDisplayProps
                                            }
                                            multiple
                                            value={user.roles}
                                            onChange={(event) =>
                                                this.updateRoles(
                                                    event as React.ChangeEvent<{
                                                        value: string[];
                                                    }>,
                                                    user,
                                                )
                                            }
                                            renderValue={(selected) => (
                                                <div>
                                                    {(selected as string[]).map(
                                                        (value) => (
                                                            <Chip
                                                                key={value}
                                                                label={value}
                                                                className={
                                                                    classes.chip
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        >
                                            {this.state.availableRoles.map(
                                                (role) => (
                                                    <MenuItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        {role}
                                                    </MenuItem>
                                                ),
                                            )}
                                        </Select>
                                    </FormControl>
                                </th>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
export default withStyles(styles, {})(Users);

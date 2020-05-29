import React from 'react';
import axios from 'axios';
import { createStyles, WithStyles, withStyles } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';
import FormControl from '@material-ui/core/FormControl';

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface User {
    _id: string;
    googleID: string;
    name: string;
    email: string;
    roles: string[];
}

const availableRoles = ['admin', 'reader', 'curator'];

interface UsersState {
    users: User[];
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
type Props = WithStyles<typeof styles>;

class Users extends React.Component<Props, UsersState> {
    constructor(props: Props) {
        super(props);
        this.state = { users: [], url: '/api/users/' };
    }

    componentDidMount(): void {
        axios
            .get<ListResponse>(this.state.url)
            .then((resp) => {
                this.setState({ users: resp.data.users });
            })
            .catch((e) => {
                this.setState({ users: [] });
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
                            <th className={classes.headerCell}>User</th>
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
                                    {user.name}
                                </th>
                                <th
                                    className={classes.cell}
                                    data-testid={`${user.name}-roles`}
                                >
                                    <FormControl>
                                        <Select
                                            data-testid={`${user.name}-select-roles`}
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
                                            {availableRoles.map((role) => (
                                                <MenuItem
                                                    key={role}
                                                    value={role}
                                                >
                                                    {role}
                                                </MenuItem>
                                            ))}
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

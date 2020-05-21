import React from 'react';
import axios from 'axios';

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface User {
    googleID: string;
    name: string;
    email: string;
}

interface UsersState {
    users: User[];
}

class Users extends React.Component<{}, UsersState> {
    constructor(props: {}) {
        super(props);
        this.state = { users: [] };
    }

    componentDidMount(): void {
        axios
            .get<ListResponse>('/api/users')
            .then((resp) => {
                this.setState({ users: resp.data.users });
            })
            .catch((e) => {
                this.setState({ users: [] });
                console.error(e);
            });
    }
    render(): JSX.Element {
        return (
            <div>
                {this.state.users.map(user =>
                    <div key={user.googleID}>{user.name}</div>)}
            </div>
        )
    }
}

export default Users;
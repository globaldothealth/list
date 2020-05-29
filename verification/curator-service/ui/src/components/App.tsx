import { Link, Route, Switch } from 'react-router-dom';

import EpidNavbar from './EpidNavbar';
import LinelistTable from './LinelistTable';
import React from 'react';
import SourceTable from './SourceTable';
import Profile from './Profile';
import Users from './Users';
import { ThemeProvider } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import axios from 'axios';

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#37474f',
        },
        secondary: {
            main: '#c5e1a5',
        },
    },
});

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

class App extends React.Component<{}, User> {
    constructor(props: {}) {
        super(props);
        this.state = {
            _id: '',
            name: '',
            email: '',
            roles: [],
        };
    }

    componentDidMount(): void {
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                this.setState({
                    _id: resp.data._id,
                    name: resp.data.name,
                    email: resp.data.email,
                    roles: resp.data.roles,
                });
            })
            .catch((e) => {
                this.setState({ _id: '', name: '', email: '', roles: [] });
                console.error(e);
            });
    }
    hasAnyRole(requiredRoles: string[]) {
        return this.state.roles?.some((r: string) => requiredRoles.includes(r));
    }

    render(): JSX.Element {
        return (
            <ThemeProvider theme={theme}>
                <div className="App">
                    <EpidNavbar user={this.state} />
                    <Switch>
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <Route path="/cases">
                                <LinelistTable />
                            </Route>
                        )}
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <Route path="/sources">
                                <SourceTable />
                            </Route>
                        )}
                        {this.state.email && (
                            <Route path="/profile">
                                <Profile user={this.state} />
                            </Route>
                        )}
                        {this.hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users />
                            </Route>
                        )}
                        <Route exact path="/">
                            <Home user={this.state} />
                        </Route>
                    </Switch>
                </div>
            </ThemeProvider>
        );
    }
}

interface HomeProps {
    user: User;
}
class Home extends React.Component<HomeProps, {}> {
    hasAnyRole(requiredRoles: string[]) {
        return this.props.user.roles?.some((r: string) =>
            requiredRoles.includes(r),
        );
    }
    render(): JSX.Element {
        return (
            <div>
                {!this.props.user.email ? (
                    <div>Login to access Epid</div>
                ) : (
                    <nav>
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <div>
                                <Link to="/cases">Linelist</Link>
                            </div>
                        )}
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <div>
                                <Link to="/sources">Sources</Link>
                            </div>
                        )}
                        <div>
                            <Link to="/profile">Profile</Link>
                            <br />
                        </div>
                        {this.hasAnyRole(['admin']) && (
                            <div>
                                <Link to="/users">Manage users</Link>
                            </div>
                        )}
                    </nav>
                )}
            </div>
        );
    }
}

export default App;

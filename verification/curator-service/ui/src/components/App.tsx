import { Link, Route, Switch } from 'react-router-dom';

import NewCaseForm from './NewCaseForm';
import CompletenessCharts from './CompletenessCharts';
import CumulativeCharts from './CumulativeCharts';
import FreshnessCharts from './FreshnessCharts';
import LinelistTable from './LinelistTable';
import Navbar from './Navbar';
import Profile from './Profile';
import React from 'react';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import Users from './Users';
import axios from 'axios';
import { createMuiTheme } from '@material-ui/core/styles';

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
        this.getUser();
    }
    getUser() {
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
                    <Navbar user={this.state} />
                    <Switch>
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <Route exact path="/cases">
                                <LinelistTable user={this.state} />
                            </Route>
                        )}
                        {this.hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <NewCaseForm user={this.state} />
                            </Route>
                        )}
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <Route path="/sources">
                                <SourceTable />
                            </Route>
                        )}
                        <Route path="/charts/cumulative">
                            <CumulativeCharts />
                        </Route>
                        <Route path="/charts/freshness">
                            <FreshnessCharts />
                        </Route>
                        <Route path="/charts/completeness">
                            <CompletenessCharts />
                        </Route>
                        {this.state.email && (
                            <Route path="/profile">
                                <Profile user={this.state} />
                            </Route>
                        )}
                        {this.hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users
                                    user={this.state}
                                    onUserChange={() => this.getUser()}
                                />
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
                    <div>Login to access Global Health Curator Portal</div>
                ) : (
                    <nav>
                        <div>
                            <a
                                href="https://covid-19.ghdsi.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Covid-19 Map
                            </a>
                        </div>
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <div>
                                <Link to="/cases">Linelist</Link>
                            </div>
                        )}
                        {this.hasAnyRole(['curator']) && (
                            <div>
                                <Link to="/cases/new">Enter new case</Link>
                            </div>
                        )}
                        {this.hasAnyRole(['curator', 'reader']) && (
                            <div>
                                <Link to="/sources">Sources</Link>
                            </div>
                        )}
                        <div>
                            <Link to="/charts/cumulative">
                                Cumulative charts
                            </Link>
                        </div>
                        <div>
                            <Link to="/charts/freshness">Freshness charts</Link>
                        </div>
                        <div>
                            <Link to="/charts/completeness">
                                Completeness charts
                            </Link>
                        </div>
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

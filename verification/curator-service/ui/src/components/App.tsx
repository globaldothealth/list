import { Link, Route, Switch } from 'react-router-dom';

import CompletenessCharts from './CompletenessCharts';
import { CssBaseline } from '@material-ui/core';
import CumulativeCharts from './CumulativeCharts';
import FreshnessCharts from './FreshnessCharts';
import LinelistTable from './LinelistTable';
import Navbar from './Navbar';
import NewCaseForm from './NewCaseForm';
import Profile from './Profile';
import React from 'react';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import Users from './Users';
import axios from 'axios';
import { createMuiTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';
import { createStyles } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/core/styles/withStyles';

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

const styles = () =>
    createStyles({
        page: {
            paddingTop: '70px',
        },
    });

type Props = WithStyles<typeof styles>;

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

class App extends React.Component<Props, User> {
    constructor(props: Props) {
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
    getUser(): void {
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

    hasAnyRole(requiredRoles: string[]): boolean {
        return this.state.roles?.some((r: string) => requiredRoles.includes(r));
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="App">
                    <Navbar user={this.state} />
                    <div className={classes.page}>
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
                </div>
            </ThemeProvider>
        );
    }
}

interface HomeProps {
    user: User;
}
class Home extends React.Component<HomeProps, {}> {
    hasAnyRole(requiredRoles: string[]): boolean {
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
                                href="http://covid-19.ghdsi.org/"
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

export default withStyles(styles, {})(App);

import {
    AppBar,
    Button,
    CssBaseline,
    IconButton,
    Toolbar,
    Typography,
} from '@material-ui/core';
import { Link, Route, Switch } from 'react-router-dom';

import Add from '@material-ui/icons/Add';
import BarChartIcon from '@material-ui/icons/BarChart';
import BubbleChartIcon from '@material-ui/icons/BubbleChart';
import BulkCaseForm from './BulkCaseForm';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CompletenessCharts from './CompletenessCharts';
import CumulativeCharts from './CumulativeCharts';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import EditCase from './EditCase';
import FreshnessCharts from './FreshnessCharts';
import Home from './Home';
import HomeIcon from '@material-ui/icons/Home';
import LinelistTable from './LinelistTable';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import NewCaseForm from './NewCaseForm';
import PeopleIcon from '@material-ui/icons/People';
import PersonIcon from '@material-ui/icons/Person';
import Profile from './Profile';
import Publish from '@material-ui/icons/Publish';
import React from 'react';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import User from './User';
import Users from './Users';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import clsx from 'clsx';
import { createMuiTheme } from '@material-ui/core/styles';
import { createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#78A3FF',
        },
        secondary: {
            main: '#000000',
        },
    },
});

const drawerWidth = 240;

const styles = () =>
    createStyles({
        root: {
            display: 'flex',
        },
        title: {
            flexGrow: 1,
        },
        appBar: {
            background: 'white',
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        },
        appBarShift: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        hide: {
            display: 'none',
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: drawerWidth,
        },
        drawerHeader: {
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
            justifyContent: 'flex-end',
        },
        content: {
            flexGrow: 1,
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: -drawerWidth,
        },
        contentShift: {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        },
    });

type Props = WithStyles<typeof styles>;

interface State {
    drawerOpen: boolean;
    user: User;
}

class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            drawerOpen: false,
            user: {
                _id: '',
                name: '',
                email: '',
                roles: [],
            },
        };
        // https://reactjs.org/docs/handling-events.html.
        this.handleDrawerClose = this.handleDrawerClose.bind(this);
        this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
        this.getUser = this.getUser.bind(this);
        this.hasAnyRole = this.hasAnyRole.bind(this);
    }

    componentDidMount(): void {
        this.getUser();
    }
    getUser(): void {
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                this.setState({
                    user: {
                        _id: resp.data._id,
                        name: resp.data.name,
                        email: resp.data.email,
                        roles: resp.data.roles,
                    },
                });
            })
            .catch((e) => {
                this.setState({
                    user: { _id: '', name: '', email: '', roles: [] },
                });
                console.error(e);
            });
    }

    hasAnyRole(requiredRoles: string[]): boolean {
        return this.state.user.roles?.some((r: string) =>
            requiredRoles.includes(r),
        );
    }

    handleDrawerOpen(): void {
        this.setState({ drawerOpen: true });
    }

    handleDrawerClose(): void {
        this.setState({ drawerOpen: false });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <AppBar
                        position="fixed"
                        className={clsx(classes.appBar, {
                            [classes.appBarShift]: this.state.drawerOpen,
                        })}
                    >
                        <Toolbar>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                onClick={this.handleDrawerOpen}
                                edge="start"
                                className={clsx(
                                    classes.menuButton,
                                    this.state.drawerOpen && classes.hide,
                                )}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                variant="h6"
                                className={classes.title}
                                noWrap
                            >
                                Global Health Curator Portal
                            </Typography>
                            {this.state.user.email ? (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    href="/auth/logout"
                                >
                                    Logout {this.state.user.email}
                                </Button>
                            ) : (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    href={process.env.REACT_APP_LOGIN_URL}
                                >
                                    Login
                                </Button>
                            )}
                        </Toolbar>
                    </AppBar>
                    <Drawer
                        className={classes.drawer}
                        variant="persistent"
                        anchor="left"
                        open={this.state.drawerOpen}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                    >
                        <div className={classes.drawerHeader}>
                            <IconButton onClick={this.handleDrawerClose}>
                                {theme.direction === 'ltr' ? (
                                    <ChevronLeftIcon />
                                ) : (
                                    <ChevronRightIcon />
                                )}
                            </IconButton>
                        </div>
                        <Divider />
                        <List>
                            {[
                                {
                                    text: 'Home',
                                    icon: <HomeIcon />,
                                    to: '/',
                                    displayCheck: (): boolean => true,
                                    divider: true,
                                },
                                {
                                    text: 'Linelist',
                                    icon: <ListIcon />,
                                    to: '/cases',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['reader', 'curator']),
                                },
                                {
                                    text: 'New',
                                    icon: <Add />,
                                    to: '/cases/new',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['curator']),
                                },
                                {
                                    text: 'Bulk upload',
                                    icon: <Publish />,
                                    to: '/cases/bulk',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['curator']),
                                    divider: true,
                                },
                                {
                                    text: 'Sources',
                                    icon: <LinkIcon />,
                                    to: '/sources',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['reader', 'curator']),
                                    divider: true,
                                },
                                {
                                    text: 'Cumulative charts',
                                    icon: <BarChartIcon />,
                                    to: '/charts/cumulative',
                                    displayCheck: (): boolean => true,
                                },
                                {
                                    text: 'Freshness charts',
                                    icon: <BubbleChartIcon />,
                                    to: '/charts/freshness',
                                    displayCheck: (): boolean => true,
                                },
                                {
                                    text: 'Completeness charts',
                                    icon: <ShowChartIcon />,
                                    to: '/charts/completeness',
                                    displayCheck: (): boolean => true,
                                    divider: true,
                                },
                                {
                                    text: 'Profile',
                                    icon: <PersonIcon />,
                                    to: '/profile',
                                    displayCheck: (): boolean =>
                                        this.state.user.email !== '',
                                },
                                {
                                    text: 'Manage users',
                                    icon: <PeopleIcon />,
                                    to: '/users',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['admin']),
                                },
                            ].map(
                                (item) =>
                                    item.displayCheck() && (
                                        <ListItem
                                            button
                                            key={item.text}
                                            divider={item.divider}
                                        >
                                            <ListItemIcon>
                                                {item.icon}
                                            </ListItemIcon>
                                            <Link
                                                to={item.to}
                                                onClick={this.handleDrawerClose}
                                            >
                                                <ListItemText
                                                    primary={item.text}
                                                />
                                            </Link>
                                        </ListItem>
                                    ),
                            )}
                        </List>
                    </Drawer>
                    <main
                        className={clsx(classes.content, {
                            [classes.contentShift]: this.state.drawerOpen,
                        })}
                    >
                        <div className={classes.drawerHeader} />
                        <Switch>
                            {this.hasAnyRole(['curator']) && (
                                <Route
                                    path="/cases/edit/:id"
                                    render={({ match }) => {
                                        return (
                                            <EditCase
                                                id={match.params.id}
                                                user={this.state.user}
                                            />
                                        );
                                    }}
                                />
                            )}
                            {this.hasAnyRole(['curator', 'reader']) && (
                                <Route exact path="/cases">
                                    <LinelistTable user={this.state.user} />
                                </Route>
                            )}
                            {this.hasAnyRole(['curator']) && (
                                <Route path="/cases/new">
                                    <NewCaseForm user={this.state.user} />
                                </Route>
                            )}
                            {this.hasAnyRole(['curator']) && (
                                <Route path="/cases/bulk">
                                    <BulkCaseForm user={this.state.user} />
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
                            {this.state.user.email && (
                                <Route path="/profile">
                                    <Profile user={this.state.user} />
                                </Route>
                            )}
                            {this.hasAnyRole(['admin']) && (
                                <Route path="/users">
                                    <Users
                                        user={this.state.user}
                                        onUserChange={this.getUser}
                                    />
                                </Route>
                            )}
                            <Route exact path="/">
                                <Home user={this.state.user} />
                            </Route>
                        </Switch>
                    </main>
                </ThemeProvider>
            </div>
        );
    }
}

export default withStyles(styles, {})(App);

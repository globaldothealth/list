import {
    AppBar,
    Button,
    CssBaseline,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@material-ui/core';
import { Link, Route, Switch } from 'react-router-dom';
import { Theme, createStyles } from '@material-ui/core/styles';

import AddIcon from '@material-ui/icons/Add';
import BulkCaseForm from './BulkCaseForm';
import CaseForm from './CaseForm';
import Charts from './Charts';
import Drawer from '@material-ui/core/Drawer';
import HomeIcon from '@material-ui/icons/Home';
import LinelistTable from './LinelistTable';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import PeopleIcon from '@material-ui/icons/People';
import PersonIcon from '@material-ui/icons/Person';
import Profile from './Profile';
import React from 'react';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import User from './User';
import Users from './Users';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import clsx from 'clsx';
import { createMuiTheme } from '@material-ui/core/styles';
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

const styles = (theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
        },
        title: {
            flexGrow: 1,
        },
        appBar: {
            background: 'white',
            zIndex: theme.zIndex.drawer + 1,
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
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
        },
        content: {
            flexGrow: 1,
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: -drawerWidth,
            width: '100%',
        },
        contentShift: {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
            width: `calc(100% - ${drawerWidth}px)`,
        },
        createNewButton: {
            margin: '1em',
            width: '70%',
        },
    });

type Props = WithStyles<typeof styles>;

interface State {
    drawerOpen: boolean;
    user: User;
    createNewButtonAnchorEl?: Element;
    showCaseForm: boolean;
    caseFormId: string;
    showBulkUpload: boolean;
}

class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            drawerOpen: true,
            user: {
                _id: '',
                name: '',
                email: '',
                roles: [],
            },
            createNewButtonAnchorEl: undefined,
            showCaseForm: false,
            caseFormId: '',
            showBulkUpload: false,
        };
        // https://reactjs.org/docs/handling-events.html.
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.getUser = this.getUser.bind(this);
        this.hasAnyRole = this.hasAnyRole.bind(this);
        this.openCreateNewPopup = this.openCreateNewPopup.bind(this);
        this.closeCreateNewPopup = this.closeCreateNewPopup.bind(this);
        this.showCaseForm = this.showCaseForm.bind(this);
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

    toggleDrawer(): void {
        this.setState({ drawerOpen: !this.state.drawerOpen });
    }

    openCreateNewPopup(event: any): void {
        this.setState({ createNewButtonAnchorEl: event.currentTarget });
    }

    closeCreateNewPopup(): void {
        this.setState({ createNewButtonAnchorEl: undefined });
    }

    showCaseForm(id?: string): void {
        this.setState({ showCaseForm: true, caseFormId: id ?? '' });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <AppBar position="fixed" className={classes.appBar}>
                        <Toolbar>
                            <IconButton
                                color="inherit"
                                aria-label="toggle drawer"
                                onClick={this.toggleDrawer}
                                edge="start"
                                className={classes.menuButton}
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
                        <div className={classes.drawerHeader}></div>
                        {this.hasAnyRole(['curator']) && (
                            <>
                                <Button
                                    variant="outlined"
                                    data-testid="create-new-button"
                                    className={classes.createNewButton}
                                    onClick={this.openCreateNewPopup}
                                    startIcon={<AddIcon />}
                                >
                                    Create new
                                </Button>
                                <Menu
                                    anchorEl={
                                        this.state.createNewButtonAnchorEl
                                    }
                                    getContentAnchorEl={null}
                                    keepMounted
                                    open={Boolean(
                                        this.state.createNewButtonAnchorEl,
                                    )}
                                    onClose={this.closeCreateNewPopup}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            this.closeCreateNewPopup();
                                            this.setState({
                                                showCaseForm: true,
                                            });
                                        }}
                                    >
                                        New line list case
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            this.closeCreateNewPopup();
                                            this.setState({
                                                showBulkUpload: true,
                                            });
                                        }}
                                    >
                                        New bulk upload
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                        {/* // TODO: update case table data when CaseForm and
                        BulkCaseForm modals are closed */}
                        {this.state.showCaseForm && (
                            <CaseForm
                                user={this.state.user}
                                onModalClose={() =>
                                    this.setState({ showCaseForm: false })
                                }
                            />
                        )}
                        {this.state.showBulkUpload && (
                            <BulkCaseForm
                                user={this.state.user}
                                onModalClose={() =>
                                    this.setState({ showBulkUpload: false })
                                }
                            />
                        )}
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
                                    text: 'Sources',
                                    icon: <LinkIcon />,
                                    to: '/sources',
                                    displayCheck: (): boolean =>
                                        this.hasAnyRole(['reader', 'curator']),
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
                                        <Link key={item.text} to={item.to}>
                                            <ListItem
                                                button
                                                key={item.text}
                                                divider={item.divider}
                                            >
                                                <ListItemIcon>
                                                    {item.icon}
                                                </ListItemIcon>

                                                <ListItemText
                                                    primary={item.text}
                                                />
                                            </ListItem>
                                        </Link>
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
                            {this.hasAnyRole(['curator', 'reader']) && (
                                <Route exact path="/cases">
                                    <LinelistTable user={this.state.user} />
                                </Route>
                            )}
                            {this.hasAnyRole(['curator', 'reader']) && (
                                <Route path="/sources">
                                    <SourceTable />
                                </Route>
                            )}
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
                                <Charts />
                            </Route>
                        </Switch>
                    </main>
                </ThemeProvider>
            </div>
        );
    }
}

export default withStyles(styles, {})(App);

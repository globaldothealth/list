import {
    AppBar,
    Button,
    CssBaseline,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@material-ui/core';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';

import AddIcon from '@material-ui/icons/Add';
import BulkCaseForm from './BulkCaseForm';
import CaseForm from './CaseForm';
import Charts from './Charts';
import Drawer from '@material-ui/core/Drawer';
import EditCase from './EditCase';
import HomeIcon from '@material-ui/icons/Home';
import LanguageIcon from '@material-ui/icons/Language';
import LinelistTable from './LinelistTable';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PeopleIcon from '@material-ui/icons/People';
import PersonIcon from '@material-ui/icons/Person';
import Profile from './Profile';
import ReportIcon from '@material-ui/icons/Report';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import User from './User';
import Users from './Users';
import ViewCase from './ViewCase';
import axios from 'axios';
import clsx from 'clsx';
import { createMuiTheme } from '@material-ui/core/styles';

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

const menuStyles = makeStyles((theme) => ({
    menu: {
        marginLeft: '1em',
    },
    link: {
        color: theme.palette.text.primary,
    },
}));

function TopbarMenu(): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const classes = menuStyles();

    return (
        <div className={classes.menu}>
            <IconButton
                aria-controls="topbar-menu"
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClose}>
                    <a
                        className={classes.link}
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://global.health"
                    >
                        About Global.Health
                    </a>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <a
                        className={classes.link}
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://github.com/globaldothealth/list/issues/new/choose"
                    >
                        Report an issue
                    </a>
                </MenuItem>
            </Menu>
        </div>
    );
}

const useStyles = makeStyles((theme: Theme) => ({
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
}));

export default function App(): JSX.Element {
    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [user, setUser] = useState<User>({
        _id: '',
        name: '',
        email: '',
        roles: [],
    });
    const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
    const [
        createNewButtonAnchorEl,
        setCreateNewButtonAnchorEl,
    ] = useState<Element | null>();

    useEffect(() => {
        setDrawerOpen(showMenu);
    }, [showMenu]);

    const getUser = (): void => {
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                setUser({
                    _id: resp.data._id,
                    name: resp.data.name,
                    email: resp.data.email,
                    roles: resp.data.roles,
                });
            })
            .catch((e) => {
                setUser({ _id: '', name: '', email: '', roles: [] });
                console.error(e);
            });
    };

    const hasAnyRole = (requiredRoles: string[]): boolean => {
        if (!user) {
            return false;
        }
        return user?.roles?.some((r: string) => requiredRoles.includes(r));
    };

    const toggleDrawer = (): void => {
        setDrawerOpen(!drawerOpen);
    };

    const openCreateNewPopup = (event: any): void => {
        setCreateNewButtonAnchorEl(event.currentTarget);
    };

    const closeCreateNewPopup = (): void => {
        setCreateNewButtonAnchorEl(undefined);
    };

    useEffect(() => {
        getUser();
    }, []);

    const classes = useStyles();
    const history = useHistory();
    return (
        <div className={classes.root}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="toggle drawer"
                            onClick={toggleDrawer}
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
                        {user?.email ? (
                            <Button
                                variant="outlined"
                                color="secondary"
                                href="/auth/logout"
                            >
                                Logout {user?.email}
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
                        <TopbarMenu />
                    </Toolbar>
                </AppBar>
                <Drawer
                    className={classes.drawer}
                    variant="persistent"
                    anchor="left"
                    open={drawerOpen}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.drawerHeader}></div>
                    {hasAnyRole(['curator']) && (
                        <>
                            <Button
                                variant="outlined"
                                data-testid="create-new-button"
                                className={classes.createNewButton}
                                onClick={openCreateNewPopup}
                                startIcon={<AddIcon />}
                            >
                                Create new
                            </Button>
                            <Menu
                                anchorEl={createNewButtonAnchorEl}
                                getContentAnchorEl={null}
                                keepMounted
                                open={Boolean(createNewButtonAnchorEl)}
                                onClose={closeCreateNewPopup}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                            >
                                <MenuItem
                                    onClick={(): void => {
                                        closeCreateNewPopup();
                                        history.push('/cases/new');
                                    }}
                                >
                                    New line list case
                                </MenuItem>
                                <MenuItem
                                    onClick={(): void => {
                                        closeCreateNewPopup();
                                        history.push('/cases/bulk');
                                    }}
                                >
                                    New bulk upload
                                </MenuItem>
                            </Menu>
                        </>
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
                                    hasAnyRole(['reader', 'curator']),
                            },
                            {
                                text: 'Sources',
                                icon: <LinkIcon />,
                                to: '/sources',
                                displayCheck: (): boolean =>
                                    hasAnyRole(['reader', 'curator']),
                                divider: true,
                            },
                            {
                                text: 'Profile',
                                icon: <PersonIcon />,
                                to: '/profile',
                                displayCheck: (): boolean => user?.email !== '',
                            },
                            {
                                text: 'Manage users',
                                icon: <PeopleIcon />,
                                to: '/users',
                                displayCheck: (): boolean =>
                                    hasAnyRole(['admin']),
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

                                            <ListItemText primary={item.text} />
                                        </ListItem>
                                    </Link>
                                ),
                        )}
                    </List>
                </Drawer>
                <main
                    className={clsx(classes.content, {
                        [classes.contentShift]: drawerOpen,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    <Switch>
                        {hasAnyRole(['curator', 'reader']) && (
                            <Route exact path="/cases">
                                <LinelistTable user={user} />
                            </Route>
                        )}
                        {hasAnyRole(['curator', 'reader']) && (
                            <Route path="/sources">
                                <SourceTable />
                            </Route>
                        )}
                        {user.email && (
                            <Route path="/profile">
                                <Profile user={user} />
                            </Route>
                        )}
                        {hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users user={user} onUserChange={getUser} />
                            </Route>
                        )}{' '}
                        {hasAnyRole(['curator']) && (
                            <Route path="/cases/bulk">
                                <BulkCaseForm
                                    user={user}
                                    onModalClose={(): void =>
                                        history.push('/cases')
                                    }
                                />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <CaseForm
                                    user={user}
                                    onModalClose={(): void =>
                                        history.push('/cases')
                                    }
                                />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route
                                path="/cases/edit/:id"
                                render={({ match }) => {
                                    return (
                                        <EditCase
                                            id={match.params.id}
                                            user={user}
                                            onModalClose={(): void =>
                                                history.push('/cases')
                                            }
                                        />
                                    );
                                }}
                            />
                        )}
                        {hasAnyRole(['curator', 'reader']) && (
                            <Route
                                path="/cases/view/:id"
                                render={({ match }): JSX.Element => {
                                    return (
                                        <ViewCase
                                            id={match.params.id}
                                            enableEdit={hasAnyRole(['curator'])}
                                            onModalClose={(): void =>
                                                history.push('/cases')
                                            }
                                        />
                                    );
                                }}
                            />
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

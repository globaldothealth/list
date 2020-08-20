import {
    AppBar,
    Button,
    CssBaseline,
    Fab,
    IconButton,
    Menu,
    MenuItem,
    Popper,
    Toolbar,
    useMediaQuery,
} from '@material-ui/core';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';

import AddIcon from '@material-ui/icons/Add';
import Alerts from './Alerts';
import BulkCaseForm from './BulkCaseForm';
import CaseForm from './CaseForm';
import Charts from './Charts';
import Drawer from '@material-ui/core/Drawer';
import EditCase from './EditCase';
import { ReactComponent as GHListLogo } from './assets/GHListLogo.svg';
import HomeIcon from '@material-ui/icons/Home';
import LinelistTable from './LinelistTable';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import NotificationsIcon from '@material-ui/icons/Notifications';
import PeopleIcon from '@material-ui/icons/People';
import PersonIcon from '@material-ui/icons/Person';
import Profile from './Profile';
import SourceTable from './SourceTable';
import { ThemeProvider } from '@material-ui/core/styles';
import User from './User';
import Users from './Users';
import ViewCase from './ViewCase';
import axios from 'axios';
import clsx from 'clsx';
import { createMuiTheme } from '@material-ui/core/styles';
import { useLastLocation } from 'react-router-last-location';

const theme = createMuiTheme({
    palette: {
        background: {
            default: '#ecf3f0',
            paper: '#ffffff',
        },
        primary: {
            main: '#0E7569',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00C6AF',
            contrastText: '#ffffff',
        },
        error: {
            main: '#FD685B',
            contrastText: '#454545',
        },
    },
    typography: {
        fontFamily: 'Mabry Pro, sans-serif',
    },
    shape: {
        borderRadius: 4,
    },
    overrides: {
        MuiListItem: {
            root: {
                color: '#5D5D5D',
                borderRadius: '4px',
                '&$selected': {
                    backgroundColor: '#E7EFED',
                    color: '#0E7569',
                },
            },
        },
    },
});

const drawerWidth = 240;

const menuStyles = makeStyles((theme) => ({
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
        <>
            <IconButton
                aria-controls="topbar-menu"
                aria-haspopup="true"
                onClick={handleClick}
                color="inherit"
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
        </>
    );
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
    },
    buttonLabel: {
        display: 'block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    spacer: {
        flexGrow: 1,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    alertsButton: {
        marginLeft: '0.5em',
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        border: 'none',
        width: drawerWidth,
    },
    drawerContents: {
        marginLeft: '12px',
        marginRight: '40px',
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
        margin: '12px 0',
        width: '100%',
    },
    createNewIcon: {
        marginRight: '12px',
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
        alertsAnchorEl,
        setAlertsAnchorEl,
    ] = React.useState<null | HTMLElement>(null);
    const alertsRef = React.createRef<HTMLDivElement>();
    const alertsOpen = Boolean(alertsAnchorEl);
    const [
        createNewButtonAnchorEl,
        setCreateNewButtonAnchorEl,
    ] = useState<Element | null>();
    const [selectedMenuIndex, setSelectedMenuIndex] = React.useState<number>();
    const lastLocation = useLastLocation();
    const history = useHistory();
    const menuList = [
        {
            text: 'Home',
            icon: <HomeIcon />,
            to: '/',
            displayCheck: (): boolean => true,
        },
        {
            text: 'Linelist',
            icon: <ListIcon />,
            to: '/cases',
            displayCheck: (): boolean => hasAnyRole(['reader', 'curator']),
        },
        {
            text: 'Sources',
            icon: <LinkIcon />,
            to: '/sources',
            displayCheck: (): boolean => hasAnyRole(['reader', 'curator']),
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
            displayCheck: (): boolean => hasAnyRole(['admin']),
        },
    ];

    useEffect(() => {
        setDrawerOpen(showMenu);
    }, [showMenu]);

    useEffect(() => {
        const menuIndex = menuList.findIndex(
            (menuItem) => menuItem.to === history.location.pathname,
        );
        if (menuIndex !== -1) {
            setSelectedMenuIndex(menuIndex);
        }
    }, [history.location.pathname, menuList]);

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

    const toggleAlertsPanel = (): void => {
        setAlertsAnchorEl(alertsAnchorEl ? null : alertsRef.current);
    };

    const openCreateNewPopup = (event: any): void => {
        setCreateNewButtonAnchorEl(event.currentTarget);
    };

    const closeCreateNewPopup = (): void => {
        setCreateNewButtonAnchorEl(undefined);
    };

    const onModalClose = (): void => {
        if (lastLocation) {
            history.goBack();
        } else {
            history.push('/cases');
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar ref={alertsRef}>
                        <IconButton
                            color="inherit"
                            aria-label="toggle drawer"
                            onClick={toggleDrawer}
                            edge="start"
                            className={classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        <GHListLogo />
                        <span className={classes.spacer}></span>
                        {user?.email ? (
                            <Button
                                classes={{ label: classes.buttonLabel }}
                                variant="outlined"
                                color="inherit"
                                href="/auth/logout"
                            >
                                Logout {user?.email}
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                color="inherit"
                                href={process.env.REACT_APP_LOGIN_URL}
                            >
                                Login
                            </Button>
                        )}
                        {hasAnyRole(['curator']) && (
                            <IconButton
                                color="inherit"
                                aria-label="toggle alerts panel"
                                onClick={toggleAlertsPanel}
                                className={classes.alertsButton}
                            >
                                <NotificationsIcon />
                            </IconButton>
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
                    <div className={classes.drawerContents}>
                        <div className={classes.drawerHeader}></div>
                        {hasAnyRole(['curator']) && (
                            <>
                                <Fab
                                    variant="extended"
                                    data-testid="create-new-button"
                                    className={classes.createNewButton}
                                    color="secondary"
                                    onClick={openCreateNewPopup}
                                >
                                    <AddIcon
                                        className={classes.createNewIcon}
                                    />
                                    Create new
                                </Fab>
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
                                    <Link
                                        to="/cases/new"
                                        onClick={closeCreateNewPopup}
                                    >
                                        <MenuItem>New line list case</MenuItem>
                                    </Link>
                                    <Link
                                        to="/cases/bulk"
                                        onClick={closeCreateNewPopup}
                                    >
                                        <MenuItem>New bulk upload</MenuItem>
                                    </Link>
                                </Menu>
                            </>
                        )}
                        <List>
                            {menuList.map(
                                (item, index) =>
                                    item.displayCheck() && (
                                        <Link key={item.text} to={item.to}>
                                            <ListItem
                                                button
                                                key={item.text}
                                                selected={
                                                    selectedMenuIndex === index
                                                }
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
                    </div>
                </Drawer>
                {hasAnyRole(['curator']) && (
                    <Popper
                        anchorEl={alertsAnchorEl}
                        open={alertsOpen}
                        placement="bottom-end"
                        // zIndex necessary to show above table headers
                        style={{ zIndex: 10 }}
                        keepMounted
                    >
                        <Alerts />
                    </Popper>
                )}
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
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <CaseForm
                                    user={user}
                                    onModalClose={onModalClose}
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
                                            onModalClose={onModalClose}
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
                                            onModalClose={onModalClose}
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

import {
    AppBar,
    Avatar,
    ButtonBase,
    CssBaseline,
    Divider,
    Fab,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@material-ui/core';
import LinelistTable, { DownloadButton } from './LinelistTable';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';

import AddIcon from '@material-ui/icons/Add';
import AutomatedSourceForm from './AutomatedSourceForm';
import BulkCaseForm from './BulkCaseForm';
import CaseForm from './CaseForm';
import Charts from './Charts';
import Drawer from '@material-ui/core/Drawer';
import EditCase from './EditCase';
import { ReactComponent as GHListLogo } from './assets/GHListLogo.svg';
import { ReactComponent as GHMapLogo } from './assets/GHMapLogo.svg';
import HomeIcon from '@material-ui/icons/Home';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import PeopleIcon from '@material-ui/icons/People';
import Profile from './Profile';
import PublishIcon from '@material-ui/icons/Publish';
import SearchBar from './SearchBar';
import SourceTable from './SourceTable';
import TermsOfService from './TermsOfService';
import { ThemeProvider } from '@material-ui/core/styles';
import UploadsTable from './UploadsTable';
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
                    backgroundColor: '#0E75691A',
                    color: '#0E7569',
                },
            },
        },
        MuiAppBar: {
            colorPrimary: {
                backgroundColor: '#ECF3F0',
            },
        },
        MuiCheckbox: {
            colorSecondary: {
                '&$checked': {
                    color: '#31A497',
                },
            },
        },
        MuiTablePagination: {
            root: {
                border: 'unset',
                fontFamily: 'Inter',
                '& .MuiTablePagination-input': {
                    fontFamily: 'Inter',
                },
                '&&& .MuiTypography-root': {
                    fontFamily: 'Inter',
                    fontSize: '14px',
                },
            },
        },
    },
});

const drawerWidth = 240;

const menuStyles = makeStyles((theme) => ({
    link: {
        color: theme.palette.text.primary,
        fontWeight: 300,
    },
    divider: {
        marginTop: '1em',
        marginBottom: '1em',
    },
}));

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
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        backgroundColor: '#ECF3F0',
        border: 'none',
        width: drawerWidth,
    },
    drawerContents: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        marginLeft: '24px',
        marginRight: '32px',
    },
    drawerHeader: {
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
    },
    mapButton: {
        backgroundColor: '#CAD9E3',
        borderRadius: '8px',
        height: '42px',
    },
    viewMapText: {
        margin: '0 12px',
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        width: '100%',
    },
    termsText: {
        marginBottom: theme.spacing(3),
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
    covidTitle: {
        fontSize: '28px',
        marginLeft: '14px',
        marginTop: '8px',
    },
    searchBar: {
        flex: 1,
        marginLeft: theme.spacing(4),
        marginRight: theme.spacing(2),
    },
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
    },
}));

function ProfileMenu(props: { user?: User }): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const classes = menuStyles();

    return (
        <div>
            <IconButton
                aria-controls="profile-menu"
                data-testid="profile-menu"
                aria-haspopup="true"
                onClick={handleClick}
            >
                <Avatar alt={props.user?.email} src={props.user?.picture} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {props.user ? (
                    <>
                        <Link to="/profile" onClick={handleClose}>
                            <MenuItem>Profile</MenuItem>
                        </Link>

                        <a className={classes.link} href="/auth/logout">
                            <MenuItem>Logout</MenuItem>
                        </a>
                    </>
                ) : (
                    <a
                        className={classes.link}
                        href={process.env.REACT_APP_LOGIN_URL}
                    >
                        <MenuItem>Login</MenuItem>
                    </a>
                )}
                <Divider className={classes.divider} />
                <Link to="/terms" onClick={handleClose}>
                    <MenuItem>About Global.Health</MenuItem>
                </Link>
                <a
                    className={classes.link}
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://github.com/globaldothealth/list/issues/new/choose"
                    onClick={handleClose}
                >
                    <MenuItem>Report an issue</MenuItem>
                </a>
            </Menu>
        </div>
    );
}

interface LocationState {
    search: string;
}

export default function App(): JSX.Element {
    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [user, setUser] = useState<User | undefined>();
    const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
    const [
        createNewButtonAnchorEl,
        setCreateNewButtonAnchorEl,
    ] = useState<Element | null>();
    const [selectedMenuIndex, setSelectedMenuIndex] = React.useState<number>();
    const lastLocation = useLastLocation();
    const history = useHistory();
    const location = useLocation<LocationState>();
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
            to: { pathname: '/cases', state: { search: '' } },
            displayCheck: (): boolean => user !== undefined,
        },
        {
            text: 'Sources',
            icon: <LinkIcon />,
            to: '/sources',
            displayCheck: (): boolean => hasAnyRole(['curator']),
        },
        {
            text: 'Uploads',
            icon: <PublishIcon />,
            to: '/uploads',
            displayCheck: (): boolean => hasAnyRole(['curator']),
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
        const menuIndex = menuList.findIndex((menuItem) => {
            const pathname =
                typeof menuItem.to === 'string'
                    ? menuItem.to
                    : menuItem.to.pathname;
            return pathname === location.pathname;
        });
        if (menuIndex !== -1) {
            setSelectedMenuIndex(menuIndex);
        }
    }, [location.pathname, menuList]);

    const getUser = (): void => {
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                setUser({
                    _id: resp.data._id,
                    name: resp.data.name,
                    email: resp.data.email,
                    roles: resp.data.roles,
                    picture: resp.data.picture,
                });
            })
            .catch((e) => {
                setUser(undefined);
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
                <AppBar
                    position="fixed"
                    elevation={0}
                    className={classes.appBar}
                >
                    <Toolbar>
                        <IconButton
                            color="primary"
                            aria-label="toggle drawer"
                            onClick={toggleDrawer}
                            edge="start"
                            className={classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        <GHListLogo />
                        {location.pathname === '/cases' && user ? (
                            <>
                                <div className={classes.searchBar}>
                                    <SearchBar
                                        searchQuery={
                                            location.state?.search ?? ''
                                        }
                                        onSearchChange={(searchQuery): void => {
                                            history.push('/cases', {
                                                search: searchQuery,
                                            });
                                        }}
                                    ></SearchBar>
                                </div>
                                <DownloadButton
                                    search={location.state?.search ?? ''}
                                ></DownloadButton>
                            </>
                        ) : (
                            <span className={classes.spacer}></span>
                        )}
                        <ProfileMenu user={user} />
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
                        <Typography className={classes.covidTitle}>
                            COVID-19
                        </Typography>
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
                                    <Link
                                        to="/sources/automated"
                                        onClick={closeCreateNewPopup}
                                    >
                                        <MenuItem>
                                            New automated source
                                        </MenuItem>
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
                        <div className={classes.spacer}></div>
                        <ButtonBase
                            href="http://covid-19.global.health/#coverage"
                            rel="noopener noreferrer"
                            target="_blank"
                            data-testid="mapButton"
                            classes={{ root: classes.mapButton }}
                        >
                            <Typography
                                variant="caption"
                                classes={{ root: classes.viewMapText }}
                            >
                                View cases on
                            </Typography>
                            <GHMapLogo />
                        </ButtonBase>
                        <div className={classes.divider}></div>
                        <div className={classes.termsText}>
                            <div>Global.health</div>
                            <Link to="/terms">Terms of use</Link>
                        </div>
                    </div>
                </Drawer>
                <main
                    className={clsx(classes.content, {
                        [classes.contentShift]: drawerOpen,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    <Switch>
                        {user && (
                            <Route exact path="/cases">
                                <LinelistTable user={user} />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route exact path="/sources">
                                <SourceTable />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route exact path="/uploads">
                                <UploadsTable />
                            </Route>
                        )}
                        {user && (
                            <Route path="/profile">
                                <Profile user={user} />
                            </Route>
                        )}
                        {user && hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users user={user} onUserChange={getUser} />
                            </Route>
                        )}{' '}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/sources/automated">
                                <AutomatedSourceForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/bulk">
                                <BulkCaseForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <CaseForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
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
                        {user && (
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
                        <Route exact path="/terms">
                            <TermsOfService />
                        </Route>
                        <Route exact path="/">
                            {hasAnyRole(['curator', 'admin']) && <Charts />}
                        </Route>
                    </Switch>
                </main>
            </ThemeProvider>
        </div>
    );
}

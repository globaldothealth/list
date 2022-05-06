import React, { useEffect, useState, useCallback } from 'react';
import {
    AppBar,
    Avatar,
    CssBaseline,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import LinelistTable, { DownloadButton } from '../LinelistTable';
import NewLinelistTable from '../NewLinelistTable';
import {
    Link,
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
} from 'react-router-dom';
import { Theme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

import AutomatedBackfill from '../AutomatedBackfill';
import AutomatedSourceForm from '../AutomatedSourceForm';
import BulkCaseForm from '../BulkCaseForm';
import CaseForm from '../CaseForm';
import AcknowledgmentsPage from '../AcknowledgmentsPage';
import EditCase from '../EditCase';
import GHListLogo from '../GHListLogo';
import LandingPage from '../landing-page/LandingPage';
import MenuIcon from '@mui/icons-material/Menu';
import Profile from '../Profile';
import SearchBar from '../SearchBar';
import SourceTable from '../SourceTable';
import TermsOfUse from '../TermsOfUse';
import UploadsTable from '../UploadsTable';
import Users from '../Users';
import ViewCase from '../ViewCase';
import clsx from 'clsx';
import { useCookieBanner } from '../../hooks/useCookieBanner';
import { MapLink } from '../../constants/types';
import { URLToSearchQuery, searchQueryToURL } from '../util/searchQuery';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    setFilterBreadcrumbs,
    deleteFilterBreadcrumbs,
} from '../../redux/app/slice';
import {
    selectIsLoading,
    selectEnv,
    selectVersion,
} from '../../redux/app/selectors';
import { getEnv, getVersion, getDiseaseName } from '../../redux/app/thunk';
import { getUserProfile, logout } from '../../redux/auth/thunk';
import { selectUser } from '../../redux/auth/selectors';
import { User } from '../../api/models/User';
import PopupSmallScreens from '../PopupSmallScreens';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import { getReleaseNotesUrl, hasAnyRole } from '../util/helperFunctions';
import { theme } from '../../theme/theme';
import { setSearchQuery } from '../../redux/linelistTable/slice';
import { selectSearchQuery } from '../../redux/linelistTable/selectors';

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
        flexDirection: 'column',
        height: '100vh',
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
    mapLink: {
        margin: '0 8px 0 16px',
        whiteSpace: 'nowrap',
    },
    hide: {
        display: 'none',
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        marginTop: '12px',
        width: '100%',
    },
    drawerHeader: {
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
    },
    link: {
        marginTop: 12,
    },
    content: {
        flexGrow: 1,
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: 0,
        padding: '0 24px',
        width: '100%',
    },
    contentShift: {
        transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: theme.drawerWidth,
        width: `calc(100% - ${theme.drawerWidth}px)`,
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

function ProfileMenu(props: { user: User; version: string }): JSX.Element {
    const dispatch = useAppDispatch();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const classes = menuStyles();

    const releaseNotesUrl = getReleaseNotesUrl(props.version);

    return (
        <div>
            <PopupSmallScreens />
            <IconButton
                aria-controls="profile-menu"
                data-testid="profile-menu"
                aria-haspopup="true"
                onClick={handleClick}
                size="large"
            >
                <Avatar alt={props.user.email} src={props.user.picture} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                data-testid="profile-menu-dropdown"
            >
                <Link to="/profile" onClick={handleClose}>
                    <MenuItem>Profile</MenuItem>
                </Link>

                <MenuItem
                    onClick={() => {
                        dispatch(logout());
                    }}
                >
                    Logout
                </MenuItem>
                <Divider className={classes.divider} />
                <a
                    href="https://global.health/about/"
                    onClick={handleClose}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <MenuItem>About Global.health</MenuItem>
                </a>
                <Link to="/data-acknowledgments" onClick={handleClose}>
                    <MenuItem>Data acknowledgments</MenuItem>
                </Link>
                <a
                    className={classes.link}
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://raw.githubusercontent.com/globaldothealth/list/main/data-serving/scripts/export-data/data_dictionary.txt"
                    onClick={handleClose}
                >
                    <MenuItem>Data dictionary</MenuItem>
                </a>
                <a
                    href="https://github.com/globaldothealth/list#globalhealth-list"
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={handleClose}
                >
                    <MenuItem>View source on Github</MenuItem>
                </a>

                {props.version && (
                    <div>
                        <Divider className={classes.divider} />

                        <a
                            href={releaseNotesUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={handleClose}
                        >
                            <MenuItem>Version: {props.version}</MenuItem>
                        </a>
                    </div>
                )}
            </Menu>
        </div>
    );
}

interface LocationState {
    search: string;
}

export interface ChipData {
    key: string;
    value: string;
}

export default function App(): JSX.Element {
    const dispatch = useAppDispatch();

    const CookieBanner = () => {
        const { initCookieBanner } = useCookieBanner();

        useEffect(() => {
            initCookieBanner();
        }, [initCookieBanner]);

        return null;
    };

    // Get current env, version and disease name
    useEffect(() => {
        dispatch(getEnv());
        dispatch(getVersion());
        dispatch(getDiseaseName());
    }, [dispatch]);

    const isLoadingUser = useAppSelector(selectIsLoading);
    const user = useAppSelector(selectUser);
    const env = useAppSelector(selectEnv);
    const appVersion = useAppSelector(selectVersion);
    const searchQuery = useAppSelector(selectSearchQuery);

    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const history = useHistory();
    const location = useLocation<LocationState>();
    const [filtersModalOpen, setFiltersModalOpen] =
        React.useState<boolean>(false);
    const [activeFilterInput, setActiveFilterInput] =
        React.useState<string>('');
    const classes = useStyles();

    const savedSearchQuery = localStorage.getItem('searchQuery');

    // Update filter breadcrumbs
    useEffect(() => {
        if (!location.pathname.includes('/cases')) {
            dispatch(setFilterBreadcrumbs([]));
            return;
        }
        if (location.pathname === '/cases') {
            const searchParams = new URLSearchParams(location.search);
            const tempFilterBreadcrumbs: ChipData[] = [];
            searchParams.forEach((value, key) => {
                tempFilterBreadcrumbs.push({ key, value });
            });
            dispatch(setFilterBreadcrumbs(tempFilterBreadcrumbs));
        }
        //eslint-disable-next-line
    }, [location.search]);

    const getUser = useCallback((): void => {
        dispatch(getUserProfile());
    }, [dispatch]);

    const toggleDrawer = (): void => {
        setDrawerOpen(!drawerOpen);
    };

    const onModalClose = (): void => {
        history.push({
            pathname: '/cases',
            search: searchQuery,
        });
    };

    useEffect(() => {
        getUser();
    }, [getUser]);

    useEffect(() => {
        if (!user) return;

        setDrawerOpen(hasAnyRole(user, ['curator', 'admin']) && showMenu);
        //eslint-disable-next-line
    }, [user]);

    // Update search query based on stored search from landing page
    useEffect(() => {
        if (savedSearchQuery === null || savedSearchQuery === '') return;

        history.push({ pathname: '/cases', search: savedSearchQuery });

        // eslint-disable-next-line
    }, [savedSearchQuery]);

    // Function for deleting filter breadcrumbs
    const handleFilterBreadcrumbDelete = (breadcrumbToDelete: ChipData) => {
        const searchParams = new URLSearchParams(location.search);
        dispatch(deleteFilterBreadcrumbs(breadcrumbToDelete));
        searchParams.delete(breadcrumbToDelete.key);
        history.push({
            pathname: '/cases',
            search: searchParams.toString(),
        });
    };

    // When user is redirected from map to this app we have to parse url search query
    useEffect(() => {
        if (location.pathname.includes('/cases/view')) return;

        dispatch(setSearchQuery(location.search));

        //eslint-disable-next-line
    }, [location.search]);

    return (
        <div className={classes.root} ref={rootRef}>
            <CookieBanner />
            <CssBaseline />
            <AppBar position="fixed" elevation={0} className={classes.appBar}>
                <Toolbar>
                    {user && hasAnyRole(user, ['curator', 'admin']) && (
                        <IconButton
                            color="primary"
                            aria-label="toggle drawer"
                            onClick={toggleDrawer}
                            edge="start"
                            className={classes.menuButton}
                            data-testid="toggle-sidebar"
                            size="large"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <GHListLogo />
                    {location.pathname === '/cases' && user ? (
                        <>
                            <div className={classes.searchBar}>
                                <SearchBar
                                    rootComponentRef={rootRef}
                                    filtersModalOpen={filtersModalOpen}
                                    setFiltersModalOpen={setFiltersModalOpen}
                                    activeFilterInput={activeFilterInput}
                                    setActiveFilterInput={setActiveFilterInput}
                                />
                            </div>
                            <DownloadButton />
                        </>
                    ) : (
                        <span className={classes.spacer}></span>
                    )}

                    <Typography>
                        <a
                            className={classes.mapLink}
                            data-testid="mapLink"
                            href={MapLink[env]}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            G.h Map
                        </a>
                    </Typography>
                    {user && <ProfileMenu user={user} version={appVersion} />}
                </Toolbar>
            </AppBar>
            {user && hasAnyRole(user, ['curator', 'admin']) && (
                <Sidebar drawerOpen={drawerOpen} />
            )}
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: drawerOpen,
                })}
            >
                <div className={classes.drawerHeader} />
                <Switch>
                    <Redirect
                        from="/:url*(/+)"
                        to={location.pathname.slice(0, -1)}
                    />
                    {user && (
                        <Route exact path="/cases">
                            {/* <LinelistTable
                                page={listPage}
                                pageSize={listPageSize}
                                onChangePage={setListPage}
                                onChangePageSize={setListPageSize}
                                handleBreadcrumbDelete={
                                    handleFilterBreadcrumbDelete
                                }
                                setFiltersModalOpen={setFiltersModalOpen}
                                setActiveFilterInput={setActiveFilterInput}
                                sortBy={sortBy}
                                sortByOrder={sortByOrder}
                                setSortBy={setSortBy}
                                setSortByOrder={setSortByOrder}
                                diseaseName={diseaseName}
                            /> */}
                            <NewLinelistTable />
                        </Route>
                    )}
                    {hasAnyRole(user, ['curator']) && (
                        <Route exact path="/sources">
                            <SourceTable />
                        </Route>
                    )}
                    {hasAnyRole(user, ['curator']) && (
                        <Route exact path="/uploads">
                            <UploadsTable />
                        </Route>
                    )}
                    {user && (
                        <Route path="/profile">
                            <Profile />
                        </Route>
                    )}
                    {user && hasAnyRole(user, ['admin']) && (
                        <Route path="/users">
                            <Users onUserChange={getUser} />
                        </Route>
                    )}{' '}
                    {user && hasAnyRole(user, ['curator']) && (
                        <Route path="/sources/automated">
                            <AutomatedSourceForm onModalClose={onModalClose} />
                        </Route>
                    )}
                    {user && hasAnyRole(user, ['curator']) && (
                        <Route path="/cases/bulk">
                            <BulkCaseForm onModalClose={onModalClose} />
                        </Route>
                    )}
                    {user && hasAnyRole(user, ['curator']) && (
                        <Route path="/sources/backfill">
                            <AutomatedBackfill onModalClose={onModalClose} />
                        </Route>
                    )}
                    {user && hasAnyRole(user, ['curator']) && (
                        <Route path="/cases/new">
                            <CaseForm onModalClose={onModalClose} />
                        </Route>
                    )}
                    {user && hasAnyRole(user, ['curator']) && (
                        <Route
                            path="/cases/edit/:id"
                            render={({ match }) => {
                                return (
                                    <EditCase
                                        id={match.params.id}
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
                                        enableEdit={hasAnyRole(user, [
                                            'curator',
                                        ])}
                                        onModalClose={onModalClose}
                                    />
                                );
                            }}
                        />
                    )}
                    <Route exact path="/data-acknowledgments">
                        <AcknowledgmentsPage />
                    </Route>
                    <Route exact path="/terms">
                        <TermsOfUse />
                    </Route>
                    <Route
                        exact
                        path="/reset-password/:token/:id"
                        component={LandingPage}
                    />
                    <Route exact path="/">
                        {user ? (
                            <Redirect
                                to={{
                                    pathname: '/cases',
                                    search: savedSearchQuery || '',
                                }}
                            />
                        ) : isLoadingUser ? (
                            <></>
                        ) : (
                            <LandingPage />
                        )}
                    </Route>
                    {/* Redirect any unavailable URLs to / after the user has loaded. */}
                    {!isLoadingUser && (
                        <Route path="/">
                            <Redirect to="/" />
                        </Route>
                    )}
                </Switch>
            </main>

            {user && <Footer drawerOpen={drawerOpen} />}
        </div>
    );
}

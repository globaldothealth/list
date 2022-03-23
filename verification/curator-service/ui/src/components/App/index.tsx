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
} from '@material-ui/core';
import LinelistTable, { DownloadButton } from '../LinelistTable';
import {
    Link,
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
} from 'react-router-dom';
import { Theme, makeStyles } from '@material-ui/core/styles';

import AutomatedBackfill from '../AutomatedBackfill';
import AutomatedSourceForm from '../AutomatedSourceForm';
import BulkCaseForm from '../BulkCaseForm';
import CaseForm from '../CaseForm';
import AcknowledgmentsPage from '../AcknowledgmentsPage';
import EditCase from '../EditCase';
import GHListLogo from '../GHListLogo';
import LandingPage from '../landing-page/LandingPage';
import MenuIcon from '@material-ui/icons/Menu';
import Profile from '../Profile';
import SearchBar from '../SearchBar';
import SourceTable from '../SourceTable';
import TermsOfUse from '../TermsOfUse';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import UploadsTable from '../UploadsTable';
import Users from '../Users';
import ViewCase from '../ViewCase';
import clsx from 'clsx';
import { useLastLocation } from 'react-router-last-location';
import { useCookieBanner } from '../../hooks/useCookieBanner';
import { SortBy, SortByOrder, MapLink } from '../../constants/types';
import { URLToSearchQuery } from '../util/searchQuery';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    setSearchQuery,
    setFilterBreadcrumbs,
    deleteFilterBreadcrumbs,
} from '../../redux/app/slice';
import { selectIsLoading, selectEnv } from '../../redux/app/selectors';
import { getEnv } from '../../redux/app/thunk';
import { getUserProfile, logout } from '../../redux/auth/thunk';
import { selectUser } from '../../redux/auth/selectors';
import { User } from '../../api/models/User';
import PopupSmallScreens from '../PopupSmallScreens';
import Sidebar from '../Sidebar';
import Footer from '../Footer';

// to use our custom theme values in typescript we need to define an extension to the ThemeOptions type.
declare module '@material-ui/core/styles' {
    interface Theme {
        custom: {
            palette: {
                button: {
                    buttonCaption: string;
                    customizeButtonColor: string;
                };
                tooltip: {
                    backgroundColor: string;
                    textColor: string;
                };
                appBar: {
                    backgroundColor: string;
                };
                landingPage: {
                    descriptionTextColor: string;
                };
            };
        };
    }
    // allow configuration using `createTheme`
    interface ThemeOptions {
        custom?: {
            palette?: {
                button?: {
                    buttonCaption?: string;
                    customizeButtonColor?: string;
                };
                tooltip?: {
                    backgroundColor?: string;
                    textColor?: string;
                };
                appBar?: {
                    backgroundColor?: string;
                };
                landingPage?: {
                    descriptionTextColor?: string;
                };
            };
        };
    }
}

export const theme = createTheme({
    palette: {
        background: {
            default: '#ecf3f0',
            paper: '#fff',
        },
        primary: {
            main: '#0E7569',
            contrastText: '#fff',
        },
        secondary: {
            main: '#00C6AF',
            contrastText: '#fff',
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
    custom: {
        palette: {
            button: {
                buttonCaption: '#ECF3F0',
                customizeButtonColor: '#ECF3F0',
            },
            tooltip: {
                backgroundColor: '#FEEFC3',
                textColor: 'rgba(0, 0, 0, 0.87)',
            },
            appBar: {
                backgroundColor: '#31A497',
            },
            landingPage: {
                descriptionTextColor: '#838D89',
            },
        },
    },
});

export const drawerWidth = 240;

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
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
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

function ProfileMenu(props: { user: User }): JSX.Element {
    const dispatch = useAppDispatch();

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
            <PopupSmallScreens />
            <IconButton
                aria-controls="profile-menu"
                data-testid="profile-menu"
                aria-haspopup="true"
                onClick={handleClick}
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

    // Get current env
    useEffect(() => {
        dispatch(getEnv());
    }, [dispatch]);

    const isLoadingUser = useAppSelector(selectIsLoading);
    const user = useAppSelector(selectUser);
    const env = useAppSelector(selectEnv);

    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [listPage, setListPage] = React.useState<number>(0);
    const [listPageSize, setListPageSize] = React.useState<number>(50);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const lastLocation = useLastLocation();
    const history = useHistory();
    const location = useLocation<LocationState>();
    const [filtersModalOpen, setFiltersModalOpen] =
        React.useState<boolean>(false);
    const [activeFilterInput, setActiveFilterInput] =
        React.useState<string>('');
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.ConfirmationDate);
    const [sortByOrder, setSortByOrder] = useState<SortByOrder>(
        SortByOrder.Descending,
    );
    const classes = useStyles();

    const savedSearchQuery = localStorage.getItem('searchQuery');

    const hasAnyRole = useCallback(
        (requiredRoles: string[]): boolean => {
            if (!user) {
                return false;
            }
            return user?.roles?.some((r: string) => requiredRoles.includes(r));
        },
        [user],
    );

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
        if (lastLocation) {
            history.goBack();
        } else {
            history.push('/cases');
        }
    };

    useEffect(() => {
        getUser();
    }, [getUser]);

    useEffect(() => {
        if (!user) return;

        setDrawerOpen(hasAnyRole(['curator', 'admin']) && showMenu);
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

    useEffect(() => {
        if (location.pathname.includes('/cases/view')) return;
        dispatch(setSearchQuery(URLToSearchQuery(location.search)));

        //eslint-disable-next-line
    }, [location.search]);

    return (
        <div className={classes.root} ref={rootRef}>
            <ThemeProvider theme={theme}>
                <CookieBanner />
                <CssBaseline />
                <AppBar
                    position="fixed"
                    elevation={0}
                    className={classes.appBar}
                >
                    <Toolbar>
                        {user && hasAnyRole(['curator']) && (
                            <IconButton
                                color="primary"
                                aria-label="toggle drawer"
                                onClick={toggleDrawer}
                                edge="start"
                                className={classes.menuButton}
                                data-testid="toggle-sidebar"
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
                                        setFiltersModalOpen={
                                            setFiltersModalOpen
                                        }
                                        activeFilterInput={activeFilterInput}
                                        setActiveFilterInput={
                                            setActiveFilterInput
                                        }
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
                        {user && <ProfileMenu user={user} />}
                    </Toolbar>
                </AppBar>
                {user && hasAnyRole(['curator']) && (
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
                                <LinelistTable
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
                                />
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
                                <Profile />
                            </Route>
                        )}
                        {user && hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users onUserChange={getUser} />
                            </Route>
                        )}{' '}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/sources/automated">
                                <AutomatedSourceForm
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/bulk">
                                <BulkCaseForm onModalClose={onModalClose} />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/sources/backfill">
                                <AutomatedBackfill
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <CaseForm onModalClose={onModalClose} />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
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
                                            enableEdit={hasAnyRole(['curator'])}
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
            </ThemeProvider>
        </div>
    );
}

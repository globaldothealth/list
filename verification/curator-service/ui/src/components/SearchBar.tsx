import React, { useState, useEffect } from 'react';
import {
    Button,
    IconButton,
    InputAdornment,
    TextField,
    Theme,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import HelpIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import clsx from 'clsx';
import DataGuideDialog from './DataGuideDialog';
import { useDebounce } from '../hooks/useDebounce';
import FiltersDialog from './FiltersDialog';
import { searchQueryToURL, URLToSearchQuery } from './util/searchQuery';
import { useLocation, useHistory } from 'react-router-dom';
import { KeyboardEvent, ChangeEvent } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectFilterBreadcrumbs } from '../redux/app/selectors';
import { setModalOpen } from '../redux/filters/slice';

const searchBarStyles = makeStyles((theme: Theme) => ({
    searchRoot: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        backgroundColor: theme.palette.primary.main,
        height: '40px',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        width: '1px',
    },
    activeButton: {
        fontWeight: 'bold',
    },
    multilineColor: {
        color: 'red',
    },
}));

const StyledSearchTextField = withStyles((theme: Theme) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
                border: `1px solid  ${theme.palette.primary.main}`,
            },
            '&.Mui-focused fieldset': {
                border: `1px solid  ${theme.palette.primary.main}`,
            },
            '& #search-field': {
                minWidth: '100px',
            },
        },
    },
}))(TextField);

const StyledInputAdornment = withStyles({
    positionStart: {
        marginRight: 0,
    },
})(InputAdornment);

interface SearchBarProps {
    rootComponentRef: React.RefObject<HTMLDivElement>;
}

export default function SearchBar({
    rootComponentRef,
}: SearchBarProps): JSX.Element {
    const dispatch = useAppDispatch();
    const classes = searchBarStyles();
    const location = useLocation();
    const history = useHistory();

    const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
    const [isDataGuideOpen, setIsDataGuideOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>(
        location.search.includes('?q=')
            ? URLToSearchQuery(location.search)
            : '',
    );
    const [modalAlert, setModalAlert] = useState<boolean>(false);
    const guideButtonRef = React.useRef<HTMLButtonElement>(null);

    const [searchError, setSearchError] = useState<boolean>(false);

    const filtersBreadcrumb = useAppSelector(selectFilterBreadcrumbs);

    useEffect(() => {
        if (filtersBreadcrumb.length > 0) {
            setSearchError(false);
            return;
        }
    }, [filtersBreadcrumb]);

    // Set search query debounce to 1000ms
    const debouncedSearch = useDebounce(searchInput, 2000);

    // Update search input based on search query
    useEffect(() => {
        if (!location.search.includes('?q=')) {
            setSearchInput('');
            return;
        }

        setSearchInput(URLToSearchQuery(location.search));
    }, [location.search]);

    // Apply filter parameters after delay
    useEffect(() => {
        if (!isUserTyping) return;

        setIsUserTyping(false);
        history.push({
            pathname: '/cases',
            search: searchQueryToURL(debouncedSearch),
        });
        //eslint-disable-next-line
    }, [debouncedSearch]);

    const toggleDataGuide = async (): Promise<void> => {
        setIsDataGuideOpen((isOpen) => !isOpen);
    };

    const handleKeyPress = (ev: React.KeyboardEvent<HTMLDivElement>): void => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            setIsUserTyping(false);
            history.push({
                pathname: '/cases',
                search: searchQueryToURL(searchInput),
            });
        }
    };

    const disallowFilteringInSearchBar = (
        e:
            | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            | KeyboardEvent<HTMLInputElement>,
    ) => {
        e.preventDefault();
        setIsUserTyping(false);
        setModalAlert(true);
        dispatch(setModalOpen(true));
    };

    function handleSetModalAlert(shouldTheAlertStillBeOpen: boolean) {
        setModalAlert(shouldTheAlertStillBeOpen);
    }

    function checkIfThereIsColon(
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        eventTargetValue: string,
    ) {
        let searchStringStrippedOutColon = eventTargetValue;
        if (eventTargetValue.includes(':')) {
            searchStringStrippedOutColon = eventTargetValue.replace(/:/g, '');
            setSearchError(true);
            disallowFilteringInSearchBar(event);
        } else {
            setSearchError(false);
        }

        return searchStringStrippedOutColon;
    }

    return (
        <>
            <div className={classes.searchRoot}>
                <StyledSearchTextField
                    size="small"
                    error={searchError}
                    helperText={
                        searchError &&
                        'Incorrect entry. ":" characters have been removed. Please use filters instead.'
                    }
                    id="search-field"
                    data-testid="searchbar"
                    name="searchbar"
                    onKeyPress={handleKeyPress}
                    autoComplete="off"
                    onChange={(event): void => {
                        setSearchInput(
                            checkIfThereIsColon(event, event.target.value),
                        );
                    }}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (!isUserTyping) {
                            setIsUserTyping(true);
                        }
                        if (e.key === ':') {
                            disallowFilteringInSearchBar(e);
                        }
                    }}
                    placeholder="Fulltext search"
                    value={searchInput}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                        margin: 'dense',
                        className: clsx(searchError && classes.multilineColor),
                        startAdornment: (
                            <>
                                <StyledInputAdornment position="start">
                                    <Button
                                        color="primary"
                                        startIcon={<FilterListIcon />}
                                        className="filter-button"
                                        onClick={() =>
                                            dispatch(setModalOpen(true))
                                        }
                                    >
                                        Filter
                                    </Button>
                                    <div className={classes.divider}></div>
                                </StyledInputAdornment>
                                <InputAdornment position="start">
                                    <Button
                                        color="primary"
                                        startIcon={<HelpIcon />}
                                        onClick={toggleDataGuide}
                                        className={clsx({
                                            [classes.activeButton]:
                                                isDataGuideOpen,
                                        })}
                                        ref={guideButtonRef}
                                    >
                                        Data guide
                                    </Button>
                                    <DataGuideDialog
                                        isOpen={isDataGuideOpen}
                                        onToggle={toggleDataGuide}
                                        rootComponentRef={rootComponentRef}
                                        triggerComponentRef={guideButtonRef}
                                    />
                                    <div className={classes.divider}></div>
                                    <SearchIcon color="primary" />
                                </InputAdornment>
                            </>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {searchInput && (
                                    <IconButton
                                        color="primary"
                                        aria-label="clear search"
                                        onClick={(): void => {
                                            setSearchInput('');
                                            history.push({
                                                pathname: '/cases',
                                                search: '',
                                            });
                                        }}
                                        size="large"
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                    }}
                />
            </div>

            <FiltersDialog
                showModalAlert={modalAlert}
                closeAlert={handleSetModalAlert}
            />
        </>
    );
}

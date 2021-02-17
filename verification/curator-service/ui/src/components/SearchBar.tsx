import React, { useState, useEffect } from 'react';
import {
    Button,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    TextField,
    Theme,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import FilterListIcon from '@material-ui/icons/FilterList';
import HelpIcon from '@material-ui/icons/HelpOutline';
import SearchIcon from '@material-ui/icons/Search';
import clsx from 'clsx';
import SearchGuideDialog from './SearchGuideDialog';
import { useDebounce } from '../hooks/useDebounce';

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
    onSearchChange: (search: string) => void;
    rootComponentRef: React.RefObject<HTMLDivElement>;
    search: string;
    setSearch: (value: string) => void;
}

export default function SearchBar({
    onSearchChange,
    rootComponentRef,
    search,
    setSearch,
}: SearchBarProps): JSX.Element {
    const classes = searchBarStyles();

    const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isSearchGuideOpen, setIsSearchGuideOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>(search);

    const guideButtonRef = React.useRef<HTMLButtonElement>(null);

    // Set search query debounce to 1000ms
    const debouncedSearch = useDebounce(searchInput, 1000);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    // Apply filter parameters after delay
    useEffect(() => {
        if (!isUserTyping) return;

        onSearchChange(debouncedSearch);
        setIsUserTyping(false);
        //eslint-disable-next-line
    }, [debouncedSearch]);

    const handleFilterClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterClose = (): void => {
        setAnchorEl(null);
    };

    const clickItem = (text: string): void => {
        setSearchInput(searchInput + (searchInput ? ` ${text}:` : `${text}:`));
        handleFilterClose();
    };

    const toggleSearchGuide = async (): Promise<void> => {
        setIsSearchGuideOpen((isOpen) => !isOpen);
    };

    const handleKeyPress = (ev: React.KeyboardEvent<HTMLDivElement>): void => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            onSearchChange(searchInput);
            setIsUserTyping(false);
        }
    };

    return (
        <div className={classes.searchRoot}>
            <StyledSearchTextField
                id="search-field"
                onKeyPress={handleKeyPress}
                onChange={(event): void => {
                    setSearchInput(event.target.value);
                }}
                onKeyDown={() => {
                    if (!isUserTyping) {
                        setIsUserTyping(true);
                    }
                }}
                placeholder="Search"
                value={searchInput}
                variant="outlined"
                fullWidth
                InputProps={{
                    margin: 'dense',
                    startAdornment: (
                        <>
                            <StyledInputAdornment position="start">
                                <Button
                                    color="primary"
                                    startIcon={<FilterListIcon />}
                                    onClick={handleFilterClick}
                                >
                                    Filter
                                </Button>
                                <div className={classes.divider}></div>
                            </StyledInputAdornment>
                            <InputAdornment position="start">
                                <Button
                                    color="primary"
                                    startIcon={<HelpIcon />}
                                    onClick={toggleSearchGuide}
                                    className={clsx({
                                        [classes.activeButton]: isSearchGuideOpen,
                                    })}
                                    ref={guideButtonRef}
                                >
                                    Search guide
                                </Button>
                                <SearchGuideDialog
                                    isOpen={isSearchGuideOpen}
                                    onToggle={toggleSearchGuide}
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
                                        onSearchChange('');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            )}
                        </InputAdornment>
                    ),
                }}
            />
            <Menu
                anchorEl={anchorEl}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={Boolean(anchorEl)}
                onClose={handleFilterClose}
            >
                {[
                    { desc: 'curator email', value: 'curator' },
                    { desc: 'gender', value: 'gender' },
                    { desc: 'nationality', value: 'nationality' },
                    { desc: 'occupation', value: 'occupation' },
                    { desc: 'country', value: 'country' },
                    { desc: 'outcome', value: 'outcome' },
                    { desc: 'case ID', value: 'caseid' },
                    { desc: 'source URL', value: 'sourceurl' },
                    {
                        desc: 'verification status',
                        value: 'verificationstatus',
                    },
                    { desc: 'upload ID', value: 'uploadid' },
                    { desc: 'location admin 1', value: 'admin1' },
                    { desc: 'location admin 2', value: 'admin2' },
                    { desc: 'location admin 3', value: 'admin3' },
                    { desc: 'variant of concern', value: 'variant' },
                ].map((item) => (
                    <MenuItem
                        key={item.value}
                        onClick={(): void => clickItem(item.value)}
                    >
                        {item.desc}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

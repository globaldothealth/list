import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { URLToSearchQuery, searchQueryToURL } from './util/searchQuery';

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

const StyledSearchTextField = withStyles({
    root: {
        backgroundColor: 'white',
        borderRadius: '8px',
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
                border: '1px solid #0E7569',
            },
            '&.Mui-focused fieldset': {
                border: '1px solid #0E7569',
            },
        },
    },
})(TextField);

const StyledInputAdornment = withStyles({
    positionStart: {
        marginRight: 0,
    },
})(InputAdornment);

export default function SearchBar(props: {
    searchQuery: string;
    onSearchChange: (search: string) => void;
    loading: boolean;
    rootComponentRef: React.RefObject<HTMLDivElement>;
}): JSX.Element {
    const location = useLocation();
    const classes = searchBarStyles();

    const [search, setSearch] = React.useState<string>(location.search);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [isSearchGuideOpen, setIsSearchGuideOpen] = React.useState<boolean>(
        false,
    );
    const guideButtonRef = React.useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const searchString = URLToSearchQuery(location.search);
        if (searchString === search) return;

        setSearch(searchString);
        //eslint-disable-next-line
    }, [location.search]);

    const handleFilterClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleFilterClose = (): void => {
        setAnchorEl(null);
    };

    const clickItem = (text: string): void => {
        setSearch(search + (search ? ` ${text}:` : `${text}:`));
        handleFilterClose();
    };

    const toggleSearchGuide = async (): Promise<void> => {
        setIsSearchGuideOpen((isOpen) => !isOpen);
    };

    const handleKeyPress = (ev: React.KeyboardEvent<HTMLDivElement>): void => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            props.onSearchChange(searchQueryToURL(search));
        }
    };

    return (
        <div className={classes.searchRoot}>
            <StyledSearchTextField
                id="search-field"
                onKeyPress={handleKeyPress}
                onChange={(event): void => {
                    setSearch(event.target.value);
                }}
                placeholder="Search"
                value={search}
                variant="outlined"
                fullWidth
                disabled={props.loading}
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
                                    rootComponentRef={props.rootComponentRef}
                                    triggerComponentRef={guideButtonRef}
                                />
                                <div className={classes.divider}></div>
                                <SearchIcon color="primary" />
                            </InputAdornment>
                        </>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            {search && (
                                <IconButton
                                    color="primary"
                                    aria-label="clear search"
                                    onClick={(): void => {
                                        setSearch('');
                                        props.onSearchChange('');
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

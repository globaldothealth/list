import {
    Button,
    InputAdornment,
    Menu,
    MenuItem,
    TextField,
    Theme,
    Tooltip,
    makeStyles,
    withStyles,
} from '@material-ui/core';

import FilterListIcon from '@material-ui/icons/FilterList';
import HelpIcon from '@material-ui/icons/HelpOutline';
import React from 'react';
import SearchIcon from '@material-ui/icons/Search';

const searchBarStyles = makeStyles((theme: Theme) => ({
    searchRoot: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        backgroundColor: '#0E7569',
        height: '40px',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        width: '1px',
    },
}));

const HtmlTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        maxWidth: '500px',
    },
}))(Tooltip);

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

export default function SearchBar(props: {
    searchQuery: string;
    onSearchChange: (search: string) => void;
    loading: boolean;
}): JSX.Element {
    const [search, setSearch] = React.useState<string>(props.searchQuery ?? '');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    React.useEffect(() => {
        setSearch(props.searchQuery ?? '');
    }, [props.searchQuery]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (): void => {
        setAnchorEl(null);
    };

    const clickItem = (text: string): void => {
        setSearch(search + (search ? ` ${text}:` : `${text}:`));
        handleClose();
    };

    const classes = searchBarStyles();
    return (
        <div className={classes.searchRoot}>
            <StyledSearchTextField
                id="search-field"
                onKeyPress={(ev): void => {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        props.onSearchChange(search);
                    }
                }}
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
                        <InputAdornment position="start">
                            <Button
                                color="primary"
                                startIcon={<FilterListIcon />}
                                onClick={handleClick}
                            >
                                Filter
                            </Button>
                            <div className={classes.divider}></div>
                            <SearchIcon color="primary" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <HtmlTooltip
                                color="primary"
                                title={
                                    <React.Fragment>
                                        <h4>Search syntax</h4>
                                        <h5>Full text search</h5>
                                        Example:{' '}
                                        <i>"got infected at work" -India</i>
                                        <br />
                                        You can use arbitrary strings to search
                                        over those text fields:
                                        {[
                                            'notes',
                                            'curator',
                                            'occupation',
                                            'nationalities',
                                            'ethnicity',
                                            'country',
                                            'admin1',
                                            'admin2',
                                            'admin3',
                                            'place',
                                            'location name',
                                            'pathogen name',
                                            'source url',
                                            'upload ID',
                                            'verification status',
                                        ].join(', ')}
                                        <h5>Keywords search</h5>
                                        Example:{' '}
                                        <i>
                                            curator:foo@bar.com,fez@meh.org
                                            country:Japan gender:female
                                            occupation:"healthcare worker"
                                        </i>
                                        <br />
                                        Values are OR'ed for the same keyword
                                        and all keywords are AND'ed.
                                        <br />
                                        Keyword values can be quoted for
                                        multi-words matches and concatenated
                                        with a comma to union them.
                                        <br />
                                        Only equality operator is supported.
                                        <br />
                                        Supported keywords are shown when the
                                        filter button is clicked.
                                    </React.Fragment>
                                }
                                placement="left"
                            >
                                <HelpIcon />
                            </HtmlTooltip>
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
                onClose={handleClose}
            >
                {[
                    'curator',
                    'gender',
                    'nationality',
                    'occupation',
                    'country',
                    'outcome',
                    'caseid',
                    'sourceurl',
                    'verificationstatus',
                    'uploadid',
                    'admin1',
                    'admin2',
                    'admin3',
                ].map((text) => (
                    <MenuItem key={text} onClick={(): void => clickItem(text)}>
                        {text}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}

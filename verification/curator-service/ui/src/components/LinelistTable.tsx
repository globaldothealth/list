import {
    Button,
    IconButton,
    Menu,
    MenuItem,
    Theme,
    Tooltip,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import { Case, VerificationStatus } from './Case';
import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import HelpIcon from '@material-ui/icons/HelpOutline';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Link } from 'react-router-dom';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MuiAlert from '@material-ui/lab/Alert';
import Paper from '@material-ui/core/Paper';
import SearchIcon from '@material-ui/icons/SearchOutlined';
import TextField from '@material-ui/core/TextField';
import User from './User';
import VerificationStatusHeader from './VerificationStatusHeader';
import VerificationStatusIndicator from './VerificationStatusIndicator';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import renderDate from './util/date';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

interface LinelistTableState {
    url: string;
    error: string;
    pageSize: number;
    search: string;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    confirmedDate: Date | null;
    adminArea3: string;
    adminArea2: string;
    adminArea1: string;
    country: string;
    age: [number, number]; // start, end.
    gender: string;
    outcome?: string;
    sourceUrl: string;
    verificationStatus?: VerificationStatus;
}

interface LocationState {
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
    searchQuery: string;
}

interface Props
    extends RouteComponentProps<never, never, LocationState>,
        WithStyles<typeof styles> {
    user: User;
}

const HtmlTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        maxWidth: '500px',
    },
}))(Tooltip);

const styles = (theme: Theme) =>
    createStyles({
        alert: {
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(2),
        },
        centeredContent: {
            display: 'flex',
            justifyContent: 'center',
        },
    });

const searchBarStyles = makeStyles((theme: Theme) => ({
    searchBar: {
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
    searchBarInput: {
        borderRadius: theme.spacing(1),
    },
}));

function SearchBar(props: {
    searchQuery: string;
    onSearchChange: (search: string) => void;
}): JSX.Element {
    const [search, setSearch] = React.useState<string>(props.searchQuery ?? '');
    React.useEffect(() => {
        setSearch(props.searchQuery ?? '');
    }, [props.searchQuery]);

    const classes = searchBarStyles();
    return (
        <TextField
            classes={{ root: classes.searchBar }}
            id="search-field"
            label="Search"
            variant="filled"
            fullWidth
            onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    props.onSearchChange(search);
                }
            }}
            onChange={(ev) => {
                setSearch(ev.currentTarget.value);
            }}
            InputProps={{
                value: search,
                disableUnderline: true,
                classes: { root: classes.searchBarInput },
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        <HtmlTooltip
                            title={
                                <React.Fragment>
                                    <h4>Search syntax</h4>
                                    <h5>Full text search</h5>
                                    Example:{' '}
                                    <i>"got infected at work" -India</i>
                                    <br />
                                    You can use arbitrary strings to search over
                                    those text fields:
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
                                    ].join(', ')}
                                    <h5>Keywords search</h5>
                                    Example:{' '}
                                    <i>
                                        curator:foo@bar.com,fez@meh.org
                                        country:Japan gender:female
                                        occupation:"healthcare worker"
                                    </i>
                                    <br />
                                    Values are OR'ed for the same keyword and
                                    all keywords are AND'ed.
                                    <br />
                                    Keyword values can be quoted for multi-words
                                    matches and concatenated with a comma to
                                    union them.
                                    <br />
                                    Only equality operator is supported.
                                    <br />
                                    Supported keywords are: <br />
                                    <ul>
                                        {[
                                            'curator',
                                            'gender',
                                            'nationality',
                                            'occupation',
                                            'country',
                                            'outcome',
                                            'caseid',
                                            'source',
                                            'uploadid',
                                            'admin1',
                                            'admin2',
                                            'admin3',
                                        ].map(
                                            (e): JSX.Element => {
                                                return <li key={e}>{e}</li>;
                                            },
                                        )}
                                    </ul>
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
    );
}

const rowMenuStyles = makeStyles((theme: Theme) => ({
    menuItemTitle: {
        marginLeft: theme.spacing(1),
    },
}));

function RowMenu(props: {
    rowId: string;
    setError: (error: string) => void;
    refreshData: () => void;
}): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const classes = rowMenuStyles();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: any): void => {
        event?.stopPropagation();
        setAnchorEl(null);
    };

    const handleDelete = async (event?: any): Promise<void> => {
        event?.stopPropagation();
        try {
            props.setError('');
            const deleteUrl = '/api/cases/' + props.rowId;
            await axios.delete(deleteUrl);
            props.refreshData();
        } catch (e) {
            props.setError(e.toString());
        } finally {
            handleClose();
        }
    };

    return (
        <>
            <IconButton
                aria-controls="topbar-menu"
                aria-haspopup="true"
                aria-label="row menu"
                data-testid="row menu"
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
                <Link onClick={handleClose} to={`/cases/edit/${props.rowId}`}>
                    <MenuItem>
                        <EditIcon />
                        <span className={classes.menuItemTitle}>Edit</span>
                    </MenuItem>
                </Link>
                <MenuItem onClick={handleDelete}>
                    <DeleteIcon />
                    <span className={classes.menuItemTitle}>Delete</span>
                </MenuItem>
            </Menu>
        </>
    );
}

class LinelistTable extends React.Component<Props, LinelistTableState> {
    tableRef: RefObject<any> = React.createRef();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unlisten: () => void = () => {};

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            pageSize: 50,
            search: this.props.location.state?.searchQuery ?? '',
        };
    }

    componentDidMount(): void {
        // history.location.state can be updated with new values on which we
        // must refresh the table
        this.unlisten = this.props.history.listen((_, __) => {
            this.setState({
                search: this.props.history.location.state?.searchQuery ?? '',
            });
            this.tableRef.current?.onQueryChange();
        });
    }

    componentWillUnmount(): void {
        this.unlisten();
    }

    deleteCase(rowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const deleteUrl = this.state.url + rowData.id;
            this.setState({ error: '' });
            const response = axios.delete(deleteUrl);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    render(): JSX.Element {
        const { history, classes } = this.props;
        return (
            <Paper>
                {this.state.error && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="filled"
                        severity="error"
                    >
                        {this.state.error}
                    </MuiAlert>
                )}
                {!this.props.location.state?.bulkMessage &&
                    this.props.location.state?.newCaseIds &&
                    this.props.location.state?.newCaseIds.length > 0 &&
                    (this.props.location.state.newCaseIds.length === 1 ? (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="filled"
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.newCaseIds}`}
                                >
                                    <Button
                                        color="inherit"
                                        size="small"
                                        data-testid="view-case-btn"
                                    >
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.newCaseIds} added`}
                        </MuiAlert>
                    ) : (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="filled"
                        >
                            {`${this.props.location.state.newCaseIds.length} cases added`}
                        </MuiAlert>
                    ))}
                {!this.props.location.state?.bulkMessage &&
                    (this.props.location.state?.editedCaseIds?.length ?? 0) >
                        0 && (
                        <MuiAlert
                            variant="filled"
                            classes={{ root: classes.alert }}
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.editedCaseIds}`}
                                >
                                    <Button color="inherit" size="small">
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.editedCaseIds} edited`}
                        </MuiAlert>
                    )}
                {this.props.location.state?.bulkMessage && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        severity="info"
                        variant="outlined"
                    >
                        {this.props.location.state.bulkMessage}
                    </MuiAlert>
                )}
                <SearchBar
                    searchQuery={this.state.search}
                    onSearchChange={(search: string): void => {
                        this.setState({ search: search });
                        this.tableRef.current.onQueryChange();
                    }}
                ></SearchBar>
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        ...(this.props.user.roles.includes('curator')
                            ? [
                                  // TODO: move to the left of selection checkboxes when possible
                                  // https://github.com/mbrn/material-table/issues/2317
                                  {
                                      cellStyle: {
                                          padding: '0',
                                      },
                                      render: (
                                          rowData: TableRow,
                                      ): JSX.Element => (
                                          <RowMenu
                                              rowId={rowData.id}
                                              refreshData={(): void =>
                                                  this.tableRef.current.onQueryChange()
                                              }
                                              setError={(error): void =>
                                                  this.setState({
                                                      error: error,
                                                  })
                                              }
                                          ></RowMenu>
                                      ),
                                  },
                              ]
                            : []),
                        {
                            cellStyle: {
                                padding: '0',
                            },
                            headerStyle: {
                                padding: '0',
                            },
                            title: (
                                <div className={classes.centeredContent}>
                                    <VerificationStatusHeader />
                                </div>
                            ),
                            field: 'verificationStatus',
                            // The return type in the material-table dts is any.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            render: (rowData): any => {
                                return (
                                    <div className={classes.centeredContent}>
                                        <VerificationStatusIndicator
                                            status={rowData.verificationStatus}
                                        />
                                    </div>
                                );
                            },
                        },
                        {
                            title: 'Case ID',
                            field: 'id',
                            type: 'string',
                        },
                        {
                            title: 'Confirmed date',
                            field: 'confirmedDate',
                            render: (rowData): string =>
                                renderDate(rowData.confirmedDate),
                        },
                        {
                            title: 'Admin 3',
                            field: 'adminArea3',
                        },
                        {
                            title: 'Admin 2',
                            field: 'adminArea2',
                        },
                        {
                            title: 'Admin 1',
                            field: 'adminArea1',
                        },
                        {
                            title: 'Country',
                            field: 'country',
                        },
                        {
                            title: 'Age',
                            field: 'age',
                            render: (rowData) =>
                                rowData.age[0] === rowData.age[1]
                                    ? rowData.age[0]
                                    : `${rowData.age[0]}-${rowData.age[1]}`,
                        },
                        {
                            title: 'Gender',
                            field: 'gender',
                        },
                        {
                            title: 'Outcome',
                            field: 'outcome',
                        },
                        {
                            title: 'Source URL',
                            field: 'sourceUrl',
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const trimmedQ = this.state.search.trim();
                            if (trimmedQ) {
                                listUrl += '&q=' + encodeURIComponent(trimmedQ);
                            }
                            this.setState({ error: '' });
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedCases: TableRow[] = [];
                                    const cases = result.data.cases;
                                    for (const c of cases) {
                                        const confirmedEvent = c.events.find(
                                            (event) =>
                                                event.name === 'confirmed',
                                        );
                                        flattenedCases.push({
                                            id: c._id,
                                            confirmedDate: confirmedEvent
                                                ?.dateRange?.start
                                                ? new Date(
                                                      confirmedEvent.dateRange.start,
                                                  )
                                                : null,
                                            adminArea3:
                                                c.location
                                                    ?.administrativeAreaLevel3,
                                            adminArea2:
                                                c.location
                                                    ?.administrativeAreaLevel2,
                                            adminArea1:
                                                c.location
                                                    ?.administrativeAreaLevel1,
                                            country: c.location.country,
                                            age: [
                                                c.demographics?.ageRange?.start,
                                                c.demographics?.ageRange?.end,
                                            ],
                                            gender: c.demographics?.gender,
                                            outcome: c.events.find(
                                                (event) =>
                                                    event.name === 'outcome',
                                            )?.value,
                                            sourceUrl:
                                                c.caseReference?.sourceUrl,
                                            verificationStatus:
                                                c.caseReference
                                                    ?.verificationStatus,
                                        });
                                    }
                                    resolve({
                                        data: flattenedCases,
                                        page: query.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
                                    this.setState({ error: e.toString() });
                                    reject(e);
                                });
                        })
                    }
                    title="COVID-19 cases"
                    options={{
                        search: false,
                        emptyRowsWhenPaging: false,
                        filtering: false,
                        sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        selection: this.props.user.roles.includes('curator'),
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        maxBodyHeight: 'calc(100vh - 20em)',
                        headerStyle: {
                            zIndex: 1,
                        },
                        // TODO: style highlighted rows to spec
                        rowStyle: (rowData) =>
                            (
                                this.props.location.state?.newCaseIds ?? []
                            ).includes(rowData.id) ||
                            (
                                this.props.location.state?.editedCaseIds ?? []
                            ).includes(rowData.id)
                                ? { backgroundColor: '#E7EFED' }
                                : {},
                    }}
                    onChangeRowsPerPage={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                    onRowClick={(_, rowData?: TableRow): void => {
                        if (rowData) {
                            history.push(`/cases/view/${rowData.id}`);
                        }
                    }}
                    actions={
                        this.props.user.roles.includes('curator')
                            ? [
                                  // This action is for deleting selected rows.
                                  // The action for deleting single rows is in the
                                  // RowMenu function.
                                  {
                                      icon: () => (
                                          <span aria-label="delete all">
                                              <DeleteIcon />
                                          </span>
                                      ),
                                      tooltip: 'Delete selected rows',
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      onClick: (_: any, rows: any): void => {
                                          const deletePromises: Promise<
                                              unknown
                                          >[] = [];
                                          rows.forEach((row: TableRow) =>
                                              deletePromises.push(
                                                  this.deleteCase(row),
                                              ),
                                          );
                                          Promise.all(deletePromises).then(
                                              () => {
                                                  this.tableRef.current.onQueryChange();
                                              },
                                          );
                                      },
                                  },
                              ]
                            : []
                    }
                />
            </Paper>
        );
    }
}

export default withRouter(withStyles(styles)(LinelistTable));

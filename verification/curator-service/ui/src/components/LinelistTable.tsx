import {
    Button,
    Theme,
    Tooltip,
    makeStyles,
    withStyles,
} from '@material-ui/core';
import { Case, Pathogen, Travel, TravelHistory } from './Case';
import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import HelpIcon from '@material-ui/icons/HelpOutline';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Link } from 'react-router-dom';
import MuiAlert from '@material-ui/lab/Alert';
import Paper from '@material-ui/core/Paper';
import SearchIcon from '@material-ui/icons/SearchOutlined';
import TextField from '@material-ui/core/TextField';
import User from './User';
import VisibilityIcon from '@material-ui/icons/VisibilityOutlined';
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
    // demographics
    gender: string;
    age: [number, number]; // start, end.
    ethnicity: string;
    // Represents a list as a comma and space separated string e.g. 'Afghan, Albanian'
    nationalities: string;
    occupation: string;
    country: string;
    adminArea1: string;
    adminArea2: string;
    adminArea3: string;
    geoResolution: string;
    locationName: string;
    latitude: number;
    longitude: number;
    confirmedDate: Date | null;
    confirmationMethod: string;
    // Represents a list as a comma and space separated string e.g. 'fever, cough'
    symptoms: string;
    // Represents a list as a comma and space separated string e.g. 'vertical, iatrogenic'
    transmissionRoutes: string;
    // Represents a list as a comma and space separated string e.g. 'gym, hospital'
    transmissionPlaces: string;
    // Represents a list as a comma and space separated string e.g. 'caseId, caseId2'
    transmissionLinkedCaseIds: string;
    travelHistory: TravelHistory;
    pathogens: Pathogen[];
    sourceUrl: string | null;
    notes: string;
    curatedBy: string;
    outcome: string;
    admittedToHospital: string;
}

interface LocationState {
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
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
    onSearchChange: (search: string) => void;
}): JSX.Element {
    const [search, setSearch] = React.useState<string>('');

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

class LinelistTable extends React.Component<Props, LinelistTableState> {
    tableRef: RefObject<any> = React.createRef();
    unlisten: () => void;

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            pageSize: 50,
            search: '',
        };
        // history.location.state can be updated with newCaseIds, on which we
        // must refresh the table
        this.unlisten = this.props.history.listen((_, __) =>
            this.tableRef.current?.onQueryChange(),
        );
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
                    onSearchChange={(search: string): void => {
                        this.setState({ search: search });
                        this.tableRef.current.onQueryChange();
                    }}
                ></SearchBar>
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        {
                            title: 'Case ID',
                            field: 'id',
                            type: 'string',
                        },
                        {
                            title: 'Gender',
                            field: 'gender',
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
                            title: 'Race / Ethnicity',
                            field: 'ethnicity',
                        },
                        {
                            title: 'Nationality',
                            field: 'nationalities',
                        },
                        {
                            title: 'Occupation',
                            field: 'occupation',
                        },
                        {
                            title: 'Location',
                            field: 'locationName',
                        },
                        {
                            title: 'Country',
                            field: 'country',
                        },
                        {
                            title: 'Confirmed date',
                            field: 'confirmedDate',
                            render: (rowData): string =>
                                renderDate(rowData.confirmedDate),
                        },
                        {
                            title: 'Confirmation method',
                            field: 'confirmationMethod',
                        },
                        {
                            title: 'Admitted to hospital',
                            field: 'admittedToHospital',
                        },
                        {
                            title: 'Outcome',
                            field: 'outcome',
                        },
                        {
                            title: 'Symptoms',
                            field: 'symptoms',
                        },
                        {
                            title: 'Routes of transmission',
                            field: 'transmissionRoutes',
                        },
                        {
                            title: 'Places of transmission',
                            field: 'transmissionPlaces',
                        },
                        {
                            title: 'Contacted case IDs',
                            field: 'transmissionLinkedCaseIds',
                        },
                        {
                            title: 'Travel history',
                            field: 'travelHistory',
                            render: (rowData): string =>
                                rowData.travelHistory?.travel
                                    ?.map(
                                        (travel: Travel) =>
                                            travel.location?.name,
                                    )
                                    ?.join(', '),
                        },
                        {
                            title: 'Pathogens',
                            field: 'pathogens',
                            render: (rowData): string =>
                                rowData.pathogens
                                    ?.map((pathogen: Pathogen) => pathogen.name)
                                    ?.join(', '),
                        },
                        { title: 'Notes', field: 'notes' },
                        {
                            title: 'Source URL',
                            field: 'sourceUrl',
                        },
                        {
                            title: 'Curated by',
                            field: 'curatedBy',
                            tooltip:
                                'If unknown, this is most likely an imported case',
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            const trimmedQ = this.state.search.trim();
                            // TODO: We should probably use lodash.throttle on searches.
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
                                            gender: c.demographics?.gender,
                                            age: [
                                                c.demographics?.ageRange?.start,
                                                c.demographics?.ageRange?.end,
                                            ],
                                            ethnicity:
                                                c.demographics?.ethnicity,
                                            nationalities: c.demographics?.nationalities?.join(
                                                ', ',
                                            ),
                                            occupation:
                                                c.demographics?.occupation,
                                            country: c.location.country,
                                            adminArea1:
                                                c.location
                                                    ?.administrativeAreaLevel1,
                                            adminArea2:
                                                c.location
                                                    ?.administrativeAreaLevel2,
                                            adminArea3:
                                                c.location
                                                    ?.administrativeAreaLevel3,
                                            latitude:
                                                c.location?.geometry?.latitude,
                                            longitude:
                                                c.location?.geometry?.longitude,
                                            geoResolution:
                                                c.location?.geoResolution,
                                            locationName: c.location?.name,
                                            confirmedDate: confirmedEvent
                                                ?.dateRange?.start
                                                ? new Date(
                                                      confirmedEvent.dateRange.start,
                                                  )
                                                : null,
                                            confirmationMethod:
                                                confirmedEvent?.value || '',
                                            symptoms: c.symptoms?.values?.join(
                                                ', ',
                                            ),
                                            transmissionRoutes: c.transmission?.routes.join(
                                                ', ',
                                            ),
                                            transmissionPlaces: c.transmission?.places.join(
                                                ', ',
                                            ),
                                            transmissionLinkedCaseIds: c.transmission?.linkedCaseIds.join(
                                                ', ',
                                            ),
                                            travelHistory: c.travelHistory,
                                            pathogens: c.pathogens,
                                            notes: c.notes,
                                            sourceUrl:
                                                c.caseReference?.sourceUrl,
                                            curatedBy:
                                                c.revisionMetadata
                                                    ?.creationMetadata
                                                    ?.curator || 'Unknown',
                                            admittedToHospital:
                                                c.events.find(
                                                    (event) =>
                                                        event.name ===
                                                        'hospitalAdmission',
                                                )?.value || 'Unknown',
                                            outcome:
                                                c.events.find(
                                                    (event) =>
                                                        event.name ===
                                                        'outcome',
                                                )?.value || 'Unknown',
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
                        filtering: false,
                        sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        selection: true,
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        actionsColumnIndex: -1,
                        maxBodyHeight: 'calc(100vh - 20em)',
                        // TODO: style highlighted rows to spec
                        rowStyle: (rowData) =>
                            (
                                this.props.location.state?.newCaseIds ?? []
                            ).includes(rowData.id) ||
                            (
                                this.props.location.state?.editedCaseIds ?? []
                            ).includes(rowData.id)
                                ? { backgroundColor: '#E8F0FE' }
                                : {},
                    }}
                    onChangeRowsPerPage={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                    // actions cannot be a function https://github.com/mbrn/material-table/issues/676
                    actions={
                        this.props.user.roles.includes('curator')
                            ? [
                                  {
                                      icon: () => (
                                          <span aria-label="edit">
                                              <EditIcon />
                                          </span>
                                      ),
                                      tooltip: 'Edit this case',
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      onClick: (_: any, row: any): void => {
                                          // Somehow the templating system doesn't think row has an id property but it has.
                                          const id = (row as TableRow).id;
                                          history.push(`/cases/edit/${id}`);
                                      },
                                      position: 'row',
                                  },
                                  // This action is for deleting selected rows.
                                  // The action for deleting single rows is in the
                                  // editable section.
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
                                  {
                                      icon: () => (
                                          <span aria-label="details">
                                              <VisibilityIcon />
                                          </span>
                                      ),
                                      onClick: (e, row): void => {
                                          // Somehow the templating system doesn't think row has an id property but it has.
                                          const id = (row as TableRow).id;
                                          history.push(`/cases/view/${id}`);
                                      },
                                      tooltip: 'View this case details',
                                      position: 'row',
                                  },
                              ]
                            : [
                                  {
                                      icon: () => (
                                          <span aria-label="details">
                                              <VisibilityIcon />
                                          </span>
                                      ),
                                      onClick: (e, row): void => {
                                          // Somehow the templating system doesn't think row has an id property but it has.
                                          const id = (row as TableRow).id;
                                          history.push(`/cases/view/${id}`);
                                      },
                                      tooltip: 'View this case details',
                                      position: 'row',
                                  },
                              ]
                    }
                    editable={
                        this.props.user.roles.includes('curator')
                            ? {
                                  onRowDelete: (
                                      rowData: TableRow,
                                  ): Promise<unknown> =>
                                      this.deleteCase(rowData),
                              }
                            : undefined
                    }
                />
            </Paper>
        );
    }
}

export default withRouter(withStyles(styles)(LinelistTable));

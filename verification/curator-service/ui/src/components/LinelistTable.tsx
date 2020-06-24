import MaterialTable, { QueryResult } from 'material-table';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import {
    Theme,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core/styles';

import Paper from '@material-ui/core/Paper';
import React from 'react';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import { isUndefined } from 'util';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

interface Event {
    name: string;
    dateRange: {
        start: string;
        end: string;
    };
    value: string;
}

interface Demographics {
    sex: string;
    ageRange: {
        start: number;
        end: number;
    };
    ethnicity: string;
    nationalities: string[];
    profession: string;
}

interface Location {
    country: string;
    administrativeAreaLevel1: string;
    administrativeAreaLevel2: string;
    administrativeAreaLevel3: string;
    geoResolution: string;
    geometry: Geometry;
    name: string;
}

interface Geometry {
    latitude: number;
    longitude: number;
}

interface Source {
    url: string;
}

interface Symptoms {
    provided: string[];
}

interface Transmission {
    route: string;
    place: string;
    linkedCaseIds: string[];
}

interface TravelHistory {
    travel: Travel[];
}

interface Travel {
    location: Location;
}

interface Case {
    _id: string;
    importedCase: {
        outcome: string;
    };
    events: Event[];
    demographics: Demographics;
    location: Location;
    symptoms: Symptoms;
    transmission: Transmission;
    sources: Source[];
    travelHistory: TravelHistory;
    notes: string;
}

interface LinelistTableState {
    url: string;
    error: string;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    // demographics
    sex: string;
    age: [number, number]; // start, end.
    ethnicity: string;
    // Represents a list as a comma and space separated string e.g. 'Afghan, Albanian'
    nationalities: string;
    profession: string;
    country: string;
    adminArea1: string;
    adminArea2: string;
    adminArea3: string;
    geoResolution: string;
    locationName: string;
    latitude: number;
    longitude: number;
    confirmedDate: Date | null;
    confirmationMethod?: string;
    // Represents a list as a comma and space separated string e.g. 'fever, cough'
    symptoms: string;
    transmissionRoute: string;
    transmissionPlace: string;
    // Represents a list as a comma and space separated string e.g. 'caseId, caseId2'
    transmissionLinkedCaseIds: string;
    travelHistory: TravelHistory;
    // sources
    sourceUrl: string | null;
    notes: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        error: {
            color: 'red',
            marginTop: theme.spacing(2),
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
interface Props extends WithStyles<typeof styles>, RouteComponentProps {
    user: User;
}

class LinelistTable extends React.Component<Props, LinelistTableState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
        };
    }

    splitCommaSeparated(value: string | null): string[] {
        if (!value) return [];
        return value
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value !== '');
    }

    // TODO: Consider defining distinct RPC-format and UI-format Case types to
    // improve type-handling here.
    createCaseFromRowData(rowData: TableRow): unknown {
        return {
            demographics: {
                sex: rowData.sex,
                ageRange: {
                    start: rowData.age[0] ?? undefined,
                    end: rowData.age[1] ?? undefined,
                },
                ethnicity: rowData.ethnicity,
                nationalities: this.splitCommaSeparated(rowData.nationalities),
                profession: rowData.profession,
            },
            notes: rowData.notes,
            sources: [
                {
                    url: rowData.sourceUrl,
                },
            ],
            location: {
                country: rowData.country,
                administrativeAreaLevel1: rowData.adminArea1,
                administrativeAreaLevel2: rowData.adminArea2,
                administrativeAreaLevel3: rowData.adminArea3,
                geometry: {
                    latitude: rowData.latitude,
                    longitude: rowData.longitude,
                },
                name: rowData.locationName,
                geoResolution: rowData.geoResolution,
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: rowData.confirmedDate,
                    },
                    value: rowData.confirmationMethod,
                },
            ],
            symptoms: {
                provided: this.splitCommaSeparated(rowData.symptoms),
            },
            transmission: {
                route: rowData.transmissionRoute,
                place: rowData.transmissionPlace,
                linkedCaseIds: this.splitCommaSeparated(
                    rowData.transmissionLinkedCaseIds,
                ),
            },
            travelHistory: rowData.travelHistory,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: this.props.user.email,
                    date: new Date().toISOString(),
                },
            },
        };
    }

    addCase(newRowData: TableRow): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!this.validateRequired(newRowData.sourceUrl)) {
                return reject();
            }
            const newCase = this.createCaseFromRowData(newRowData);
            this.setState({ error: '' });
            const response = axios.post(this.state.url, newCase);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
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

    editCase(
        newRowData: TableRow,
        oldRowData: TableRow | undefined,
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (isUndefined(oldRowData)) {
                return reject();
            }
            if (!this.validateRequired(newRowData.sourceUrl)) {
                return reject();
            }
            const newCase = this.createCaseFromRowData(newRowData);
            this.setState({ error: '' });
            const response = axios.put(this.state.url + oldRowData.id, newCase);
            response.then(resolve).catch((e) => {
                this.setState({ error: e.toString() });
                reject(e);
            });
        });
    }

    validateRequired(field: string | null): boolean {
        return field?.trim() !== '';
    }

    render(): JSX.Element {
        const { classes, history } = this.props;
        return (
            <div>
                <Paper>
                    <MaterialTable
                        columns={[
                            {
                                title: 'Sex',
                                field: 'sex',
                                filtering: false,
                                lookup: { Female: 'Female', Male: 'Male' },
                            },
                            {
                                title: 'Age',
                                field: 'age',
                                filtering: false,
                                editable: 'never',
                                render: (rowData) =>
                                    rowData.age[0] === rowData.age[1]
                                        ? rowData.age[0]
                                        : `${rowData.age[0]}-${rowData.age[1]}`,
                            },
                            {
                                title: 'Ethnicity',
                                field: 'ethnicity',
                                filtering: false,
                            },
                            {
                                title: 'Nationality',
                                field: 'nationalities',
                                filtering: false,
                            },
                            {
                                title: 'Profession',
                                field: 'profession',
                                filtering: false,
                            },
                            {
                                title: 'Location',
                                field: 'locationName',
                                filtering: false,
                                editable: 'never',
                            },
                            {
                                title: 'Country',
                                field: 'country',
                                filtering: false,
                                editable: 'never',
                            },
                            {
                                title: 'Confirmed date',
                                field: 'confirmedDate',
                                filtering: false,
                                type: 'date',
                            },
                            {
                                title: 'Confirmation method',
                                field: 'confirmationMethod',
                                filtering: false,
                            },
                            {
                                title: 'Symptoms',
                                field: 'symptoms',
                                filtering: false,
                            },
                            {
                                title: 'Route of transmission',
                                field: 'transmissionRoute',
                                filtering: false,
                                editable: 'never',
                            },
                            {
                                title: 'Place of transmission',
                                field: 'transmissionPlace',
                                filtering: false,
                                editable: 'never',
                            },
                            {
                                title: 'Contacted case IDs',
                                field: 'transmissionLinkedCaseIds',
                                filtering: false,
                            },
                            {
                                title: 'Travel history',
                                field: 'travelHistory',
                                filtering: false,
                                editable: 'never',
                                render: (rowData) =>
                                    rowData.travelHistory?.travel
                                        ?.map((travel) => travel.location.name)
                                        ?.join(', '),
                            },
                            { title: 'Notes', field: 'notes' },
                            {
                                title: 'Source URL',
                                field: 'sourceUrl',
                                filtering: false,
                                editComponent: (props): JSX.Element => (
                                    <TextField
                                        type="text"
                                        size="small"
                                        fullWidth
                                        placeholder="Source URL"
                                        error={
                                            !this.validateRequired(props.value)
                                        }
                                        helperText={
                                            this.validateRequired(props.value)
                                                ? ''
                                                : 'Required field'
                                        }
                                        onChange={(event): void =>
                                            props.onChange(event.target.value)
                                        }
                                        defaultValue={props.value}
                                    />
                                ),
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + query.pageSize;
                                listUrl += '&page=' + (query.page + 1);
                                listUrl += '&filter=';
                                listUrl += query.filters
                                    .map(
                                        (filter) =>
                                            `${filter.column.field}:${filter.value}`,
                                    )
                                    .join(',');
                                this.setState({ error: '' });
                                const response = axios.get<ListResponse>(
                                    listUrl,
                                );
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
                                                sex: c.demographics?.sex,
                                                age: [
                                                    c.demographics?.ageRange
                                                        ?.start,
                                                    c.demographics?.ageRange
                                                        ?.end,
                                                ],
                                                ethnicity:
                                                    c.demographics?.ethnicity,
                                                nationalities: c.demographics?.nationalities?.join(
                                                    ', ',
                                                ),
                                                profession:
                                                    c.demographics?.profession,
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
                                                    c.location?.geometry
                                                        ?.latitude,
                                                longitude:
                                                    c.location?.geometry
                                                        ?.longitude,
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
                                                    confirmedEvent?.value,
                                                symptoms: c.symptoms?.provided?.join(
                                                    ', ',
                                                ),
                                                transmissionRoute:
                                                    c.transmission?.route,
                                                transmissionPlace:
                                                    c.transmission?.place,
                                                transmissionLinkedCaseIds: c.transmission?.linkedCaseIds.join(
                                                    ', ',
                                                ),
                                                travelHistory: c.travelHistory,
                                                notes: c.notes,
                                                sourceUrl:
                                                    c.sources &&
                                                    c.sources.length > 0
                                                        ? c.sources[0].url
                                                        : null,
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
                            // TODO: Create text indexes and support search queries.
                            // https://docs.mongodb.com/manual/text-search/
                            search: false,
                            filtering: true,
                            sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            pageSize: 10,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            actionsColumnIndex: -1,
                        }}
                        actions={
                            this.props.user.roles.includes('curator')
                                ? [
                                      {
                                          icon: 'add',
                                          tooltip: 'Submit new case',
                                          isFreeAction: true,
                                          onClick: (): void => {
                                              history.push('/cases/new');
                                          },
                                      },
                                  ]
                                : undefined
                        }
                        editable={
                            this.props.user.roles.includes('curator')
                                ? {
                                      onRowUpdate: (
                                          newRowData: TableRow,
                                          oldRowData: TableRow | undefined,
                                      ): Promise<unknown> =>
                                          this.editCase(newRowData, oldRowData),
                                      onRowDelete: (
                                          rowData: TableRow,
                                      ): Promise<unknown> =>
                                          this.deleteCase(rowData),
                                  }
                                : undefined
                        }
                    />
                </Paper>
                {this.state.error && (
                    <div className={classes.error}>{this.state.error}</div>
                )}
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(
    withRouter(LinelistTable),
);

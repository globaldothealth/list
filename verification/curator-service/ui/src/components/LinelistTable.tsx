import MaterialTable, { QueryResult } from 'material-table';
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
    geometry: Geometry;
}

interface Geometry {
    lat: number;
    lng: number;
}

interface Source {
    url: string;
}

interface Case {
    _id: string;
    importedCase: {
        outcome: string;
    };
    events: Event[];
    demographics: Demographics;
    location: Location;
    sources: Source[];
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
    age: number;
    ethnicity: string;
    // Represents a list as a comma and space separated string e.g. 'Afghan, Albanian'
    nationalities: string;
    profession: string;
    country: string;
    adminArea1: string;
    adminArea2: string;
    lat: number;
    lng: number;
    confirmedDate: Date | null;
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
interface Props extends WithStyles<typeof styles> {
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

    // TODO: Consider defining distinct RPC-format and UI-format Case types to
    // improve type-handling here.
    createCaseFromRowData(rowData: TableRow): unknown {
        return {
            demographics: {
                sex: rowData.sex,
                age: {
                    start: rowData.age,
                },
                ethnicity: rowData.ethnicity,
                nationalities: rowData.nationalities?.split(', '),
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
                geometry: {
                    lat: rowData.lat,
                    lng: rowData.lng,
                },
                // TODO: Infer the geo resolution from the location.
                geoResolution: 'Admin2',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: rowData.confirmedDate,
                    },
                },
            ],
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
        const { classes } = this.props;
        return (
            <div>
                <Paper>
                    <MaterialTable
                        columns={[
                            {
                                title: 'ID',
                                field: 'id',
                                filtering: false,
                                editable: 'never',
                            },
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
                                type: 'numeric',
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
                                title: 'Country',
                                field: 'country',
                                filtering: false,
                            },
                            {
                                title: 'Admin area 1',
                                field: 'adminArea1',
                                filtering: false,
                            },
                            {
                                title: 'Admin area 2',
                                field: 'adminArea2',
                                filtering: false,
                            },
                            {
                                title: 'Lat',
                                field: 'lat',
                                filtering: false,
                            },
                            {
                                title: 'Lng',
                                field: 'lng',
                                filtering: false,
                            },
                            {
                                title: 'Confirmed date',
                                field: 'confirmedDate',
                                filtering: false,
                                type: 'date',
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
                                            const confirmedDate = c.events.find(
                                                (event) =>
                                                    event.name === 'confirmed',
                                            )?.dateRange?.start;
                                            flattenedCases.push({
                                                id: c._id,
                                                sex: c.demographics?.sex,
                                                // TODO: show full age range
                                                age:
                                                    c.demographics?.ageRange
                                                        ?.start,
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
                                                lat: c.location.geometry?.lat,
                                                lng: c.location.geometry?.lng,
                                                confirmedDate: confirmedDate
                                                    ? new Date(confirmedDate)
                                                    : null,
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
                            pageSize: 10,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                        }}
                        editable={
                            this.props.user.roles.includes('curator')
                                ? {
                                      onRowAdd: (
                                          newRowData: TableRow,
                                      ): Promise<unknown> =>
                                          this.addCase(newRowData),
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

export default withStyles(styles, { withTheme: true })(LinelistTable);

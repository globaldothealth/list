import MaterialTable, { QueryResult } from 'material-table';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import TextField from '@material-ui/core/TextField';
import axios from 'axios';
import { isUndefined } from 'util';
import {
    Theme,
    createStyles,
    WithStyles,
    withStyles,
} from '@material-ui/core/styles';

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
    age: string;
}

interface Location {
    country: string;
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
    source: Source;
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
    age: string;
    country: string;
    confirmedDate: Date | null;
    // source
    sourceUrl: string;
    notes: string;
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
type Props = WithStyles<typeof styles>;

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
            },
            notes: rowData.notes,
            source: {
                url: rowData.sourceUrl,
            },
            location: {
                country: rowData.country,
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: rowData.confirmedDate,
                    },
                },
            ],
            // TODO: Replace data below with real values
            revisionMetadata: {
                date: '2020-04-23T04:00:00.000Z',
                id: 0,
                moderator: 'abc123',
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

    validateRequired(field: string): boolean {
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
                                title: 'Country',
                                field: 'country',
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
                                                age: c.demographics?.age,
                                                country: c.location.country,
                                                confirmedDate: confirmedDate
                                                    ? new Date(confirmedDate)
                                                    : null,
                                                notes: c.notes,
                                                sourceUrl: c.source?.url,
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
                            padding: 'dense',
                            pageSize: 10,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                        }}
                        editable={{
                            onRowAdd: (
                                newRowData: TableRow,
                            ): Promise<unknown> => this.addCase(newRowData),
                            onRowUpdate: (
                                newRowData: TableRow,
                                oldRowData: TableRow | undefined,
                            ): Promise<unknown> =>
                                this.editCase(newRowData, oldRowData),
                            onRowDelete: (
                                rowData: TableRow,
                            ): Promise<unknown> => this.deleteCase(rowData),
                        }}
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

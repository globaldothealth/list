import MaterialTable, { QueryResult } from 'material-table';
import React, { RefObject } from 'react';
import {
    Theme,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core/styles';

import { Link } from 'react-router-dom';
import MuiAlert from '@material-ui/lab/Alert';
import { Paper } from '@material-ui/core';
import axios from 'axios';
import renderDate from './util/date';

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        alert: {
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(2),
        },
    });

type Props = WithStyles<typeof styles>;

interface UploadsTableState {
    url: string;
    error: string;
    pageSize: number;
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
}

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    error?: string;
}

interface UploadData {
    sourceName: string;
    sourceUrl: string;
    upload: Upload;
}

interface ListUploadsResponse {
    uploads: UploadData[];
    nextPage: number;
    total: number;
}

interface TableRow {
    id: string;
    status: string;
    created: Date;
    sourceUrl: string;
    numCreated: number;
    numUpdated: number;
}

class UploadsTable extends React.Component<Props, UploadsTableState> {
    tableRef: RefObject<any> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/sources/uploads',
            error: '',
            pageSize: 10,
        };
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div>
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
                    <MaterialTable
                        tableRef={this.tableRef}
                        columns={[
                            {
                                title: 'ID',
                                field: 'id',
                            },
                            {
                                title: 'Status',
                                field: 'status',
                            },
                            {
                                title: 'Created',
                                field: 'created',
                                render: (rowData): string =>
                                    renderDate(rowData.created),
                            },
                            {
                                title: 'Source URL',
                                field: 'sourceUrl',
                            },
                            {
                                title: '# created cases',
                                field: 'numCreated',
                                render: (rowData): JSX.Element => (
                                    <Link
                                        to={{
                                            pathname: '/cases',
                                            state: {
                                                searchQuery: `uploadid:${rowData.id}`,
                                            },
                                        }}
                                    >
                                        {rowData.numCreated}
                                    </Link>
                                ),
                            },
                            {
                                title: '# updated cases',
                                field: 'numUpdated',
                                render: (rowData): JSX.Element => (
                                    <Link
                                        to={{
                                            pathname: '/cases',
                                            state: {
                                                searchQuery: `uploadid:${rowData.id}`,
                                            },
                                        }}
                                    >
                                        {rowData.numUpdated}
                                    </Link>
                                ),
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + this.state.pageSize;
                                listUrl += '&page=' + (query.page + 1);
                                this.setState({ error: '' });
                                const response = axios.get<ListUploadsResponse>(
                                    listUrl,
                                );
                                response
                                    .then((result) => {
                                        const flattenedSources = result.data.uploads
                                            .filter((u) => {
                                                const numCreated =
                                                    u.upload?.summary
                                                        ?.numCreated;
                                                const numUpdated =
                                                    u.upload?.summary
                                                        ?.numUpdated;
                                                return numCreated
                                                    ? numCreated > 0
                                                    : false || numUpdated
                                                    ? numUpdated > 0
                                                    : false;
                                            })
                                            .map((u) => {
                                                return {
                                                    id: u.upload._id,
                                                    created: u.upload.created,
                                                    status: u.upload.status,
                                                    sourceUrl: u.sourceUrl,
                                                    numCreated:
                                                        u.upload.summary
                                                            .numCreated ?? 0,
                                                    numUpdated:
                                                        u.upload.summary
                                                            .numUpdated ?? 0,
                                                };
                                            });
                                        resolve({
                                            data: flattenedSources,
                                            page: query.page,
                                            totalCount:
                                                flattenedSources.length ?? 0,
                                        });
                                    })
                                    .catch((e) => {
                                        this.setState({ error: e.toString() });
                                        reject(e);
                                    });
                            })
                        }
                        title="Uploads"
                        options={{
                            // TODO: Create text indexes and support search queries.
                            // https://docs.mongodb.com/manual/text-search/
                            search: false,
                            filtering: false,
                            sorting: false,
                            emptyRowsWhenPaging: false,
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            pageSize: this.state.pageSize,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            maxBodyHeight: 'calc(100vh - 15em)',
                            headerStyle: {
                                zIndex: 1,
                            },
                        }}
                        onChangeRowsPerPage={(newPageSize: number): void => {
                            this.setState({ pageSize: newPageSize });
                            this.tableRef.current.onQueryChange();
                        }}
                    />
                </Paper>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(UploadsTable);

import MaterialTable, { QueryResult } from 'material-table';
import { Paper, TablePagination, Typography } from '@mui/material';
import { useRef, useState } from 'react';

import { styled } from '@mui/material/styles';

import { Link } from 'react-router-dom';
import MuiAlert from '@mui/material/Alert';
import axios from 'axios';
import renderDate from './util/date';

const Alert = styled(MuiAlert)(({ theme }) => ({
    borderRadius: theme.spacing(1),
    marginTop: theme.spacing(2),
}));

const Spacer = styled('span')(() => ({
    flex: 1,
}));

const TablePaginationBar = styled('div')(({ theme }) => ({
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    height: '64px',
}));

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    numError?: number;
    error?: string;
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
    accepted: boolean;
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
    sourceName: string;
    numCreated: number;
    numUpdated: number;
    numError: number;
    accepted: boolean;
}

const UploadsTable = () => {
    // eslint-disable-next-line
    const tableRef = useRef<any>(null);

    const [url] = useState('/api/sources/uploads');
    const [error, setError] = useState('');
    const [pageSize, setPageSize] = useState(10);

    return (
        <div>
            <Paper>
                {error && (
                    <Alert variant="filled" severity="error">
                        {error}
                    </Alert>
                )}
                <MaterialTable
                    tableRef={tableRef}
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
                            title: '# created cases',
                            field: 'numCreated',
                            render: (rowData): JSX.Element => (
                                <Link
                                    to={{
                                        pathname: '/cases',
                                        search: `?uploadid=${rowData.id}`,
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
                                        search: `?uploadid=${rowData.id}`,
                                    }}
                                >
                                    {rowData.numUpdated}
                                </Link>
                            ),
                        },
                        {
                            title: '# errors',
                            field: 'numError',
                            render: (rowData): JSX.Element => (
                                <Link
                                    to={{
                                        pathname: '/cases',
                                        search: `?uploadid=${rowData.id}`,
                                    }}
                                >
                                    {rowData.numError}
                                </Link>
                            ),
                        },
                        {
                            title: 'Accepted?',
                            field: 'accepted',
                        },
                        {
                            title: 'Source name',
                            field: 'sourceName',
                        },
                        {
                            title: 'Source URL',
                            field: 'sourceUrl',
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = url;
                            listUrl += '?limit=' + pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            listUrl += '&changes_only=false';
                            setError('');
                            const response =
                                axios.get<ListUploadsResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedSources =
                                        result.data.uploads.map((u) => {
                                            return {
                                                id: u.upload._id,
                                                created: u.upload.created,
                                                status: u.upload.status,
                                                sourceUrl: u.sourceUrl,
                                                sourceName: u.sourceName,
                                                numCreated:
                                                    u.upload.summary
                                                        .numCreated ?? 0,
                                                numUpdated:
                                                    u.upload.summary
                                                        .numUpdated ?? 0,
                                                numError:
                                                    u.upload.summary.numError ??
                                                    0,
                                                accepted:
                                                    u.upload.accepted ?? '',
                                            };
                                        });
                                    resolve({
                                        data: flattenedSources,
                                        page: query.page,
                                        totalCount: result.data.total ?? 0,
                                    });
                                })
                                .catch((e) => {
                                    setError(
                                        e.response?.data?.message ||
                                            e.toString(),
                                    );
                                    reject(e);
                                });
                        })
                    }
                    components={{
                        Container: (props): JSX.Element => (
                            <Paper elevation={0} {...props}></Paper>
                        ),
                        Pagination: (props): JSX.Element => {
                            return (
                                <TablePaginationBar>
                                    <Typography>Uploads</Typography>
                                    <Spacer />
                                    <TablePagination {...props} />
                                </TablePaginationBar>
                            );
                        },
                    }}
                    style={{ fontFamily: 'Inter' }}
                    options={{
                        // TODO: Create text indexes and support search queries.
                        // https://docs.mongodb.com/manual/text-search/
                        search: false,
                        filtering: false,
                        sorting: false,
                        emptyRowsWhenPaging: false,
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        pageSize: pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'top',
                        toolbar: false,
                        maxBodyHeight: 'calc(100vh - 15em)',
                        headerStyle: {
                            zIndex: 1,
                        },
                    }}
                    onChangeRowsPerPage={(newPageSize: number): void => {
                        setPageSize(newPageSize);
                        if (tableRef && tableRef.current) {
                            tableRef.current.onQueryChange();
                        }
                    }}
                />
            </Paper>
        </div>
    );
};

export default UploadsTable;

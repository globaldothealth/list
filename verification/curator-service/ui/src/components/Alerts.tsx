import { Paper, Typography, makeStyles } from '@material-ui/core';

import ArrowForwardIos from '@material-ui/icons/ArrowForwardIos';
import React from 'react';
import axios from 'axios';
import createHref from './util/links';
import renderDate from './util/date';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles(() => ({
    container: {
        width: '360px',
    },
    section: {
        borderBottom: '1px solid #DADCE0',
        padding: '12px 24px',
    },
    textContainer: {
        alignItems: 'center',
        display: 'flex',
    },
    newSourceText: {
        flex: 1,
    },
}));

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
}

export default function Alerts(): JSX.Element {
    const classes = useStyles();
    const [uploadData, setUploadData] = React.useState<UploadData[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const history = useHistory();

    React.useEffect(() => {
        axios
            .get<ListUploadsResponse>('/api/sources/uploads')
            .then((resp) => setUploadData(resp.data.uploads))
            .catch((e) => {
                setUploadData([]);
                setErrorMessage('There was an error loading alerts');
                console.error(e);
            });
    }, []);

    const bodyMessage = (numCreated?: number, numUpdated?: number): string => {
        numCreated = numCreated ?? 0;
        numUpdated = numUpdated ?? 0;
        if (numCreated > 0 && numUpdated > 0) {
            return `Please verify ${numCreated} cases added and ${numUpdated} cases updated`;
        }
        if (numCreated > 0) {
            return `Please verify ${numCreated} cases added`;
        }
        if (numUpdated > 0) {
            return `Please verify ${numUpdated} cases updated`;
        }
        return '';
    };

    const showUploadCases = (id: string): void => {
        history.push({
            pathname: '/cases',
            state: {
                searchQuery: `uploadid:${id}`,
            },
        });
    };

    return (
        <Paper className={classes.container} elevation={2}>
            <div className={classes.section}>
                <Typography variant="h6">Alerts</Typography>
            </div>
            {errorMessage && (
                <div className={classes.section}>
                    <Typography variant="body2">{errorMessage}</Typography>
                </div>
            )}
            {!errorMessage && uploadData.length === 0 && (
                <div className={classes.section}>
                    <Typography variant="body2">No alerts</Typography>
                </div>
            )}
            {uploadData.map((uploadData) => (
                <div
                    key={uploadData.upload._id}
                    className={classes.section}
                    onClick={(): void => showUploadCases(uploadData.upload._id)}
                >
                    <Typography
                        classes={{ root: classes.textContainer }}
                        variant="subtitle1"
                    >
                        <span className={classes.newSourceText}>
                            New source verification required
                        </span>
                        <ArrowForwardIos fontSize="small" />
                    </Typography>
                    <Typography variant="body2">
                        {bodyMessage(
                            uploadData.upload.summary.numCreated,
                            uploadData.upload.summary.numUpdated,
                        )}
                        {' from '}
                        <a
                            href={createHref(uploadData.sourceUrl)}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={(e): void => e.stopPropagation()}
                        >
                            {uploadData.sourceUrl}
                        </a>
                    </Typography>
                    <Typography variant="caption">
                        {renderDate(uploadData.upload.created)}
                    </Typography>
                </div>
            ))}
        </Paper>
    );
}

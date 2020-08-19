import { Paper, Typography, makeStyles } from '@material-ui/core';

import React from 'react';
import axios from 'axios';
import renderDate from './util/date';

const useStyles = makeStyles(() => ({
    container: {
        width: '300px',
    },
    section: {
        borderBottom: '1px solid #DADCE0',
        padding: '12px 24px',
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
    const [uploads, setUploads] = React.useState<Upload[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string>('');

    React.useEffect(() => {
        axios
            .get<ListUploadsResponse>('/api/sources/uploads')
            .then((resp) => {
                setUploads(
                    resp.data.uploads.map(
                        (uploadResponse) => uploadResponse.upload,
                    ),
                );
            })
            .catch((e) => {
                setUploads([]);
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
            {!errorMessage && uploads.length === 0 && (
                <div className={classes.section}>
                    <Typography variant="body2">No alerts</Typography>
                </div>
            )}
            {uploads.map((upload) => (
                <div key={upload._id} className={classes.section}>
                    <Typography variant="subtitle1">
                        New source verification required
                    </Typography>
                    <Typography variant="body2">
                        {bodyMessage(
                            upload.summary.numCreated,
                            upload.summary.numUpdated,
                        )}
                    </Typography>
                    <Typography variant="caption">
                        {renderDate(upload.created)}
                    </Typography>
                </div>
            ))}
        </Paper>
    );
}

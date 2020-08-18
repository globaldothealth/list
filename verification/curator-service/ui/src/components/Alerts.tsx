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
    numCreated: number;
    numUpdated: number;
    error: string;
}

export default function Alerts(): JSX.Element {
    const classes = useStyles();
    const [uploads, setUploads] = React.useState<Upload[]>([]);
    const [errorMessage, setErrorMessage] = React.useState<string>('');

    React.useEffect(() => {
        axios
            .get('/api/sources/uploads')
            .then((resp) => {
                setUploads(resp.data.uploads);
            })
            .catch((e) => {
                setUploads([]);
                setErrorMessage('There was an error loading alerts');
                console.error(e);
            });
    }, []);

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
                        Please verify {upload.summary.numCreated} cases added
                    </Typography>
                    <Typography variant="caption">
                        {renderDate(upload.created)}
                    </Typography>
                </div>
            ))}
        </Paper>
    );
}

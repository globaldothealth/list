import React from 'react';
import { makeStyles } from '@material-ui/core';
import { useFormikContext } from 'formik';

const useStyles = makeStyles(() => ({
    csvInput: {
        padding: '10px',
        display: 'block',
        border: '1px solid #ccc',
    },
}));

export default function FileUpload(): JSX.Element {
    const { setFieldValue } = useFormikContext();
    const classes = useStyles();
    return (
        <div>
            <input
                className={classes.csvInput}
                data-testid="csv-input"
                id="file"
                name="file"
                type="file"
                accept=".csv"
                onChange={(
                    event: React.ChangeEvent<HTMLInputElement>,
                ): void => {
                    if (event.currentTarget.files) {
                        setFieldValue('file', event.currentTarget.files[0]);
                    }
                }}
            />
        </div>
    );
}

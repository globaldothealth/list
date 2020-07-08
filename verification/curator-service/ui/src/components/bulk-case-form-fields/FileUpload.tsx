import React from 'react';
import { makeStyles } from '@material-ui/core';
import { useFormikContext } from 'formik';
import { RequiredHelperText } from '../common-form-fields/FormikFields';

const useStyles = makeStyles(() => ({
    csvInput: {
        padding: '15px',
    },
}));

export default function FileUpload(): JSX.Element {
    const { setFieldValue } = useFormikContext();
    const classes = useStyles();
    const name = 'file';
    return (
        <fieldset>
            <legend>CSV Data</legend>
            <input
                className={classes.csvInput}
                data-testid="csv-input"
                id="file"
                name={name}
                type="file"
                accept=".csv"
                onChange={(
                    event: React.ChangeEvent<HTMLInputElement>,
                ): void => {
                    const uploadedFiles: FileList | null =
                        event.currentTarget.files;
                    if (uploadedFiles) {
                        setFieldValue('file', uploadedFiles[0]);
                        if (uploadedFiles.length > 1) {
                            console.warn(
                                `Attempted to upload ${uploadedFiles.length} ` +
                                    'files. Only one file allowed per upload.',
                            );
                        }
                    }
                }}
            />
            <RequiredHelperText name={name}></RequiredHelperText>
        </fieldset>
    );
}

import React from 'react';
import { RequiredHelperText } from '../common-form-fields/FormikFields';
import { makeStyles, Button, Typography } from '@material-ui/core';
import { useFormikContext } from 'formik';

const useStyles = makeStyles(() => ({
    borderless: {
        borderStyle: 'none',
    },
    helperText: {
        paddingBottom: '1em',
    },
    fileNameText: {
        paddingLeft: '2em',
    },
}));

export default function FileUpload(): JSX.Element {
    const [fileName, setFileName] = React.useState('');
    const { setFieldValue } = useFormikContext();
    const classes = useStyles();
    const name = 'file';
    return (
        <fieldset className={classes.borderless}>
            <Typography className={classes.helperText} variant="body2">
                Choose the file to upload
            </Typography>
            <input
                data-testid="csv-input"
                id="file-upload-input"
                name={name}
                style={{ display: 'none' }}
                type="file"
                accept=".csv"
                onChange={(
                    event: React.ChangeEvent<HTMLInputElement>,
                ): void => {
                    const uploadedFiles: FileList | null =
                        event.currentTarget.files;
                    if (uploadedFiles) {
                        setFieldValue(name, uploadedFiles[0]);
                        setFileName(uploadedFiles[0]?.name ?? '');
                        if (uploadedFiles.length > 1) {
                            console.warn(
                                `Attempted to upload ${uploadedFiles.length} ` +
                                    'files. Only one file allowed per upload.',
                            );
                        }
                    }
                }}
            />
            <label htmlFor="file-upload-input">
                <Button variant="contained" color="primary" component="span">
                    Choose file
                </Button>
                {fileName && (
                    <span className={classes.fileNameText}>{fileName}</span>
                )}
            </label>
            <RequiredHelperText name={name}></RequiredHelperText>
        </fieldset>
    );
}

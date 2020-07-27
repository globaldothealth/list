import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import { RequiredHelperText } from '../common-form-fields/FormikFields';
import { makeStyles } from '@material-ui/core';
import { useFormikContext } from 'formik';

const tooltip = (
    <React.Fragment>
        {'Select a CSV file to upload in the format described '}
        <a
            href={
                'https://github.com/globaldothealth/list/tree/main/verification/curator-service/ui#bulk-upload-process'
            }
            rel="noopener noreferrer"
            target="_blank"
        >
            {'here'}
        </a>
        {'.'}
    </React.Fragment>
);

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
            <FieldTitle
                title="CSV Data"
                tooltip={tooltip}
                interactive
            ></FieldTitle>
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
                        setFieldValue(name, uploadedFiles[0]);
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

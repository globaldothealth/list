import CaseValidationError from './CaseValidationError';
import ErrorIcon from '@material-ui/icons/Error';
import React from 'react';
import { makeStyles } from '@material-ui/core';

interface ValidateErrorListProps {
    errors: CaseValidationError[];
    maxDisplayErrors: number;
}

const useStyles = makeStyles((theme) => ({
    errorList: {
        marginLeft: theme.spacing(4),
    },
    icon: {
        verticalAlign: 'middle',
        marginRight: theme.spacing(4),
    },
    summary: {
        color: 'red',
        marginTop: '4em',
    },
}));

export default function ValidationErrorList(
    props: ValidateErrorListProps,
): JSX.Element {
    const classes = useStyles();
    const truncated = props.errors.length > props.maxDisplayErrors;
    const errorList = props.errors
        .slice(0, props.maxDisplayErrors)
        .map((error) => {
            const issues = error.formattedIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
            ));
            return (
                <li key={error.rowNumber}>
                    Row {error.rowNumber}
                    <ul>{issues}</ul>
                </li>
            );
        });
    return (
        <div>
            <p className={classes.summary} data-testid="summary">
                <ErrorIcon className={classes.icon} data-testid="icon" />
                The selected file could not be uploaded. Found{' '}
                {props.errors.length} row(s) with errors.
                {truncated &&
                    ` Displaying first ${props.maxDisplayErrors} below.`}
            </p>
            <ul className={classes.errorList}>{errorList}</ul>
        </div>
    );
}

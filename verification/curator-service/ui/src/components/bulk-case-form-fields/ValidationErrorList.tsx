import CaseValidationError from './CaseValidationError';
import ErrorIcon from '@mui/icons-material/Error';
import { styled } from '@mui/material/styles';

interface ValidateErrorListProps {
    errors: CaseValidationError[];
    maxDisplayErrors: number;
}

const Summary = styled('p')(({ theme }) => ({
    color: theme.palette.error.main,
    marginTop: '4em',
}));

export default function ValidationErrorList(
    props: ValidateErrorListProps,
): JSX.Element {
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
            <Summary data-testid="summary">
                <ErrorIcon
                    sx={{ verticalAlign: 'middle', marginRight: 4 }}
                    data-testid="icon"
                />
                The selected file could not be uploaded. Found{' '}
                {props.errors.length} row(s) with errors.
                {truncated &&
                    ` Displaying first ${props.maxDisplayErrors} below.`}
            </Summary>
            <ul>{errorList}</ul>
        </div>
    );
}

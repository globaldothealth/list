import React from 'react';
import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { FastField, Field, useFormikContext } from 'formik';

import { AutomatedSourceFormValues } from '../AutomatedSourceForm';
import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import CaseFormValues from '../new-case-form-fields/CaseFormValues';
import FormControl from '@mui/material/FormControl';
import { FormHelperText } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import MuiTextField from '@mui/material/TextField';
import { Select, TextField } from 'formik-mui';
import axios from 'axios';
import { hasKey } from '../Utils';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles(() => ({
    fieldRow: {
        marginBottom: '2em',
        width: '100%',
    },
    field: {
        width: '50%',
    },
}));

interface FormikAutocompleteProps {
    name: string;
    label: string;
    multiple: boolean;
    optionsList?: string[];
    optionsLocation?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValue: any;
    freeSolo?: boolean;
}

const filter = createFilterOptions<string>();

// Autocomplete for use in a Formik form.
// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function FormikAutocomplete(
    props: FormikAutocompleteProps,
): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<string[]>([]);
    const loading = open && options.length === 0;
    const { setFieldValue, setTouched, initialValues, values } =
        useFormikContext<CaseFormValues>();

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async (): Promise<void> => {
            let retrievedOptions = props.optionsList;
            if (!retrievedOptions && props.optionsLocation) {
                const resp = await axios.get<string>(props.optionsLocation);
                retrievedOptions = resp.data.split('\n');
            }

            if (active) {
                setOptions(retrievedOptions as string[]);
            }
        })();

        return (): void => {
            active = false;
        };
    }, [
        initialValues,
        loading,
        props.name,
        props.optionsList,
        props.optionsLocation,
        setFieldValue,
        setTouched,
    ]);

    React.useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    return (
        <Autocomplete
            multiple={props.multiple}
            filterSelectedOptions
            itemType="string"
            open={open}
            freeSolo={props.freeSolo}
            onOpen={(): void => {
                setOpen(true);
            }}
            onClose={(): void => {
                setOpen(false);
            }}
            value={hasKey(values, props.name) ? values[props.name] : undefined}
            options={options}
            filterOptions={(options: string[], params): string[] => {
                const filtered = filter(options, params) as string[];

                if (props.freeSolo && params.inputValue !== '') {
                    filtered.push(params.inputValue);
                }

                return filtered;
            }}
            loading={loading}
            onChange={(_, values): void => {
                setFieldValue(props.name, values ?? undefined);
            }}
            onBlur={(): void => setTouched({ [props.name]: true })}
            defaultValue={props.initialValue}
            renderInput={(params): JSX.Element => (
                // Do not use FastField here
                <Field
                    {...params}
                    // Setting the name properly allows any typed value
                    // to be set in the form values, rather than only selected
                    // dropdown values. Thus we use an unused form value here.
                    name="unused"
                    data-testid={props.name}
                    label={props.label}
                    component={TextField}
                ></Field>
            )}
        />
    );
}

interface SelectFieldProps {
    name: string;
    label: string;
    values: string[];
    required?: boolean;
}

export function SelectField(props: SelectFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <FormControl className={classes.fieldRow} variant="standard">
            <InputLabel htmlFor={props.name} shrink>
                {props.label}
                {props.required && ' *'}
            </InputLabel>
            <FastField
                variant="standard"
                as="select"
                name={props.name}
                type="text"
                data-testid={props.name}
                className={classes.field}
                component={Select}
            >
                {props.values.map((value) => (
                    <MenuItem key={value} value={value}>
                        {value}
                    </MenuItem>
                ))}
            </FastField>
            {props.required && (
                <RequiredHelperText name={props.name}></RequiredHelperText>
            )}
        </FormControl>
    );
}

interface DateFieldProps {
    name: string;
    label: string;
    value: Date | string | null;
    onChange: (value: unknown) => void;
    required?: boolean;
    initialFocusedDate?: string | null;
}

export function DateField(props: DateFieldProps): JSX.Element {
    const classes = useStyles();

    return (
        <div className={classes.fieldRow}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DesktopDatePicker
                    className={classes.field}
                    data-testid={props.name}
                    label={props.label}
                    inputFormat="yyyy/MM/dd"
                    mask="____/__/__"
                    minDate={new Date('2019/12/01')}
                    disableFuture
                    value={props.value}
                    onChange={props.onChange}
                    renderInput={(params) => (
                        <MuiTextField {...params} name={props.name} fullWidth />
                    )}
                />
            </LocalizationProvider>
            {props.required && (
                <RequiredHelperText name={props.name}></RequiredHelperText>
            )}
        </div>
    );
}

interface RequiredHelperTextProps {
    name: string;
    wrongUrl?: boolean;
    locationRequiredText?: string;
}

export function RequiredHelperText(
    props: RequiredHelperTextProps,
): JSX.Element {
    const { values, touched } = useFormikContext<
        CaseFormValues | BulkCaseFormValues | AutomatedSourceFormValues
    >();

    let finalHelperText = 'Required';
    if (props.wrongUrl === false) {
        finalHelperText = 'Please enter a valid URL';
    } else if (props.locationRequiredText) {
        finalHelperText = props.locationRequiredText;
    }

    return (
        <div>
            <FormHelperText
                error={
                    hasKey(touched, props.name) &&
                    touched[props.name] &&
                    hasKey(values, props.name) &&
                    (values[props.name] === undefined ||
                        values[props.name] === null ||
                        props.wrongUrl === false)
                }
            >
                {finalHelperText}
            </FormHelperText>
        </div>
    );
}

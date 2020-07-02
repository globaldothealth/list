import { FastField, Field, useFormikContext } from 'formik';

import { Autocomplete } from '@material-ui/lab';
import CaseFormValues from '../new-case-form-fields/CaseFormValues';
import DateFnsUtils from '@date-io/date-fns';
import FormControl from '@material-ui/core/FormControl';
import { FormHelperText } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import { Select } from 'formik-material-ui';
import { TextField } from 'formik-material-ui';
import axios from 'axios';
import { hasKey } from '../Utils';
import { makeStyles } from '@material-ui/core';

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
}

// Autocomplete for use in a Formik form.
// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function FormikAutocomplete(
    props: FormikAutocompleteProps,
): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<string[]>([]);
    const loading = open && options.length === 0;
    const { setFieldValue, setTouched, initialValues } = useFormikContext<
        CaseFormValues
    >();

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
            onOpen={(): void => {
                setOpen(true);
            }}
            onClose={(): void => {
                setOpen(false);
            }}
            options={options}
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
    values: (string | undefined)[];
    required?: boolean;
}

export function SelectField(props: SelectFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <FormControl className={classes.fieldRow}>
            <InputLabel htmlFor={props.name}>
                {props.label}
                {props.required && ' *'}
            </InputLabel>
            <FastField
                as="select"
                name={props.name}
                type="text"
                data-testid={props.name}
                className={classes.field}
                component={Select}
            >
                {props.values.map((value) => (
                    <MenuItem key={value ?? 'undefined'} value={value}>
                        {value ?? 'Unknown'}
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
    required?: boolean;
    initialFocusedDate?: string | null;
}

export function DateField(props: DateFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <div className={classes.fieldRow}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                {/* Don't use FastField here */}
                <Field
                    className={classes.field}
                    name={props.name}
                    label={props.label}
                    format="yyyy/MM/dd"
                    required={props.required}
                    minDate={new Date('2019/12/01')}
                    disableFuture
                    autoOk
                    initialFocusedDate={Date.parse(
                        props.initialFocusedDate ?? '',
                    )}
                    component={KeyboardDatePicker}
                />
            </MuiPickersUtilsProvider>
            {props.required && (
                <RequiredHelperText name={props.name}></RequiredHelperText>
            )}
        </div>
    );
}

interface RequiredHelperTextProps {
    name: string;
}

export function RequiredHelperText(
    props: RequiredHelperTextProps,
): JSX.Element {
    const { values, touched } = useFormikContext<CaseFormValues>();
    return (
        <div>
            {hasKey(touched, props.name) &&
                touched[props.name] &&
                hasKey(values, props.name) &&
                (values[props.name] === undefined ||
                    values[props.name] === null ||
                    values[props.name] === '') && (
                    <FormHelperText error>Required field</FormHelperText>
                )}
        </div>
    );
}

import { Field, useFormikContext } from 'formik';

import { Autocomplete } from '@material-ui/lab';
import DateFnsUtils from '@date-io/date-fns';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import { Select } from 'formik-material-ui';
import { TextField } from 'formik-material-ui';
import axios from 'axios';
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
    optionsLocation: string;
}

// Autocomplete for use in a Formik form.
// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function FormikAutocomplete(
    props: FormikAutocompleteProps,
): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<string[]>([]);
    const loading = open && options.length === 0;
    const { setFieldValue, setTouched } = useFormikContext();

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async (): Promise<void> => {
            const resp = await axios.get<string>(props.optionsLocation);
            const retrievedOptions = resp.data.split('\n');

            if (active) {
                setOptions(retrievedOptions);
            }
        })();

        return (): void => {
            active = false;
        };
    }, [loading, props.optionsLocation]);

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
            renderInput={(params): JSX.Element => (
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
}

export function SelectField(props: SelectFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <FormControl className={classes.fieldRow}>
            <InputLabel htmlFor={props.name}>{props.label}</InputLabel>
            <Field
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
            </Field>
        </FormControl>
    );
}

interface DateFieldProps {
    name: string;
    label: string;
}

export function DateField(props: DateFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <div className={classes.fieldRow}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Field
                    className={classes.field}
                    name={props.name}
                    label={props.label}
                    format="yyyy/MM/dd"
                    maxDate={new Date()}
                    minDate={new Date('2019/12/01')}
                    component={KeyboardDatePicker}
                />
            </MuiPickersUtilsProvider>
        </div>
    );
}

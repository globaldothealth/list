import { Autocomplete } from '@material-ui/lab';
import { Field } from 'formik';
import React from 'react';
import { TextField } from 'formik-material-ui';
import axios from 'axios';
import { useFormikContext } from 'formik';

interface FormikAutocompleteProps {
    name: string;
    label: string;
    multiple: boolean;
    optionsLocation: string;
}

// Autocomplete for use in a Formik form.
// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export default function FormikAutocomplete(
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

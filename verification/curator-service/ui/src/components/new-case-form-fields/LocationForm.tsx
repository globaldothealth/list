import { Field, useFormikContext } from 'formik';
import Location, { Loc } from './Location';

import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { Typography } from '@material-ui/core';
import axios from 'axios';
import throttle from 'lodash/throttle';

interface Values {
    location: Loc;
}
function LocationForm(): JSX.Element {
    const { values } = useFormikContext<Values>();
    return (
        <Scroll.Element name="location">
            <fieldset>
                <legend>Location</legend>
                <PlacesAutocomplete />
                <Location location={values.location} />
            </fieldset>
        </Scroll.Element>
    );
}

export default LocationForm;

// Place autocomplete, based on
// https://material-ui.com/components/autocomplete/#google-maps-place
function PlacesAutocomplete(): JSX.Element {
    const [value, setValue] = React.useState<Loc | null>(null);
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<Loc[]>([]);
    const { setFieldValue, setTouched } = useFormikContext();

    const fetch = React.useMemo(
        () =>
            throttle(
                async (
                    request: { q: string },
                    callback: (results?: Loc[]) => void,
                ) => {
                    const resp = await axios.get<Loc[]>(
                        '/api/geocode/suggest',
                        {
                            params: request,
                        },
                    );
                    callback(resp.data);
                },
                250,
            ),
        [],
    );

    React.useEffect(() => {
        let active = true;

        if (inputValue.trim() === '') {
            setOptions(value ? [value] : []);
            return undefined;
        }

        fetch({ q: inputValue }, (results?: Loc[]) => {
            if (active) {
                let newOptions = [] as Loc[];

                if (value) {
                    newOptions = [value];
                }

                if (results) {
                    newOptions = [...newOptions, ...results];
                }

                setOptions(newOptions);
            }
        });

        return (): void => {
            active = false;
        };
    }, [value, inputValue, fetch]);

    const name = 'location';

    return (
        <Autocomplete
            itemType="Loc"
            getOptionLabel={(option: Loc): string => option.name}
            options={options}
            value={value}
            onChange={(event: any, newValue: Loc | null): void => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                setFieldValue(name, newValue);
            }}
            onBlur={(): void => setTouched({ [name]: true })}
            onInputChange={(event, newInputValue): void => {
                setInputValue(newInputValue);
            }}
            renderInput={(params): JSX.Element => (
                <Field
                    {...params}
                    // Setting the name properly allows any typed value
                    // to be set in the form values, rather than only selected
                    // dropdown values. Thus we use an unused form value here.
                    name="unused"
                    data-testid={name}
                    label="Location"
                    component={TextField}
                    fullWidth
                ></Field>
            )}
            renderOption={(option: Loc): React.ReactNode => {
                // TODO: Provide better looking options.
                return <Typography variant="body2">{option.name}</Typography>;
            }}
        />
    );
}

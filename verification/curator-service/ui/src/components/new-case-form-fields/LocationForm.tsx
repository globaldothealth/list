import { Field, useFormikContext } from 'formik';
import { Typography, makeStyles } from '@material-ui/core';

import { Autocomplete } from '@material-ui/lab';
import { Location as Loc } from '../Case';
import Location from './Location';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
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
                <PlacesAutocomplete name="location" required={true} />
                <Location location={values.location} />
            </fieldset>
        </Scroll.Element>
    );
}

export default LocationForm;

const useStyles = makeStyles((theme) => ({
    icon: {
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(2),
    },
    suggestion: {
        display: 'flex',
        alignItems: 'center',
    },
}));

interface PlacesAutocompleteProps {
    name: string;
    required?: boolean;
}

// Place autocomplete, based on
// https://material-ui.com/components/autocomplete/#google-maps-place
export function PlacesAutocomplete(
    props: PlacesAutocompleteProps,
): JSX.Element {
    const classes = useStyles();
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

    return (
        <Autocomplete
            itemType="Loc"
            getOptionLabel={(option: Loc): string => option.name}
            options={options}
            value={value}
            onChange={(event: any, newValue: Loc | null): void => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                setFieldValue(props.name, newValue);
            }}
            onBlur={(): void => setTouched({ [props.name]: true })}
            onInputChange={(event, newInputValue): void => {
                setInputValue(newInputValue);
            }}
            renderInput={(params): JSX.Element => (
                <div>
                    <Field
                        {...params}
                        // Setting the name properly allows any typed value
                        // to be set in the form values, rather than only selected
                        // dropdown values. Thus we use an unused form value here.
                        name="unused"
                        required={props.required}
                        data-testid={props.name}
                        label="Location"
                        component={TextField}
                        fullWidth
                    ></Field>
                    {props.required && (
                        <RequiredHelperText
                            name={props.name}
                        ></RequiredHelperText>
                    )}
                </div>
            )}
            renderOption={(option: Loc): React.ReactNode => {
                return (
                    <span className={classes.suggestion}>
                        <LocationOnIcon className={classes.icon} />
                        <Typography variant="body2">{option.name}</Typography>
                    </span>
                );
            }}
        />
    );
}

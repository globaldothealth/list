import { Field, useFormikContext } from 'formik';

import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { Typography } from '@material-ui/core';
import axios from 'axios';
import { throttle } from 'lodash';

interface SourceProps {
    initialValue: string;
}

export default class Source extends React.Component<SourceProps, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="source">
                <fieldset>
                    <legend>Source</legend>
                    <SourcesAutocomplete
                        initialValue={this.props.initialValue}
                    />
                </fieldset>
            </Scroll.Element>
        );
    }
}

interface OriginData {
    url: string;
}

interface SourceData {
    _id: string;
    origin: OriginData;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

interface SourceAutocompleteProps {
    initialValue: string;
}

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const [value, setValue] = React.useState<string | null>(props.initialValue);
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<string[]>([]);
    const { setFieldValue, setTouched } = useFormikContext();
    const name = 'sourceUrl';

    const fetch = React.useMemo(
        () =>
            throttle(
                async (
                    request: { url: string },
                    callback: (results?: SourceData[]) => void,
                ) => {
                    const resp = await axios.get<ListSourcesResponse>(
                        '/api/sources',
                        {
                            params: request,
                        },
                    );
                    callback(resp.data.sources);
                },
                250,
            ),
        [],
    );

    React.useEffect(() => {
        let active = true;

        if (inputValue.trim() === '') {
            return undefined;
        }

        fetch({ url: inputValue }, (results?: SourceData[]) => {
            if (active) {
                let newOptions = [] as string[];

                if (results) {
                    newOptions = [
                        ...newOptions,
                        ...results.map((source) => source.origin.url),
                    ];
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
            // TODO: Replace freeSolo with offering an 'Add source' dialogue.
            freeSolo
            itemType="SourceData"
            options={options}
            value={value}
            onChange={(event: any, newValue: string | null): void => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                setFieldValue(name, newValue);
            }}
            onBlur={(): void => setTouched({ [name]: true })}
            onInputChange={(event, newInputValue): void => {
                setInputValue(newInputValue);
            }}
            renderInput={(params): JSX.Element => (
                <div>
                    {/* Do not use FastField here */}
                    <Field
                        {...params}
                        // Setting the name properly allows any typed value
                        // to be set in the form values, rather than only selected
                        // dropdown values. Thus we use an unused form value here.
                        name="unused"
                        required
                        data-testid={name}
                        label="Source URL"
                        placeholder="https://..."
                        component={TextField}
                        fullWidth
                    ></Field>
                    <RequiredHelperText name={name}></RequiredHelperText>
                </div>
            )}
            renderOption={(option: string): React.ReactNode => {
                return (
                    <span>
                        <Typography variant="body2">{option}</Typography>
                    </span>
                );
            }}
        />
    );
}

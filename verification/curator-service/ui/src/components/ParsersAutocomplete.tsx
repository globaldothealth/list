import React from 'react';

import axios from 'axios';
import { Autocomplete } from '@material-ui/lab';
import { CircularProgress, TextField } from '@material-ui/core';

interface LambdaFunction {
    name: string;
}

interface ParsersAutocompleteProps {
    defaultValue: string;
    onChange: (newValue: string) => void;
}

/** Autocomplete element that suggests parsers functions for automated ingestion setup */
export default function ParsersAutocomplete(
    props: ParsersAutocompleteProps,
): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<string[]>([]);
    const loading = open && options.length === 0;

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async () => {
            const res = await axios.get<LambdaFunction[]>(
                '/api/sources/parsers',
            );

            if (active) {
                setOptions(res.data.map((f) => f.name));
            }
        })();

        return () => {
            active = false;
        };
    }, [loading]);

    React.useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    return (
        <Autocomplete
            style={{ width: 300 }}
            open={open}
            // freeSolo useful in tests or if a parsing function wasn't built yet.
            freeSolo
            selectOnFocus
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            defaultValue={props.defaultValue}
            onChange={(e, val) => props.onChange(val || '')}
            onInputChange={(e, val) => props.onChange(val)}
            options={options}
            loading={loading}
            renderInput={(params) => (
                <TextField
                    {...params}
                    //label="Parsers"
                    placeholder="Parsers"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? (
                                    <CircularProgress
                                        color="inherit"
                                        size={20}
                                    />
                                ) : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
}

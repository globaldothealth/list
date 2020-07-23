import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { FastField, Field, useFormikContext } from 'formik';

import { CaseReference as CaseRef } from '../Case';
import FieldTitle from './FieldTitle';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { Typography } from '@material-ui/core';
import axios from 'axios';
import { throttle } from 'lodash';

interface SourceProps {
    initialValue?: CaseRef;
    hasSourceEntryId?: boolean;
}

// TODO: format this text to have newlines in it
const tooltipText =
    'Enter the URL of the data source used for reporting the line list case. ' +
    'If this is a new data source you will need to add it to the system along with a data source name. The form will prompt you to do this if this is the case. ' +
    'If the URL is an existing source already in the system, select the appropriate source from the list provided. ';

export default class Source extends React.Component<SourceProps, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="source">
                <fieldset>
                    <FieldTitle
                        title="Source"
                        tooltip={tooltipText}
                    ></FieldTitle>
                    <SourcesAutocomplete
                        initialValue={this.props.initialValue}
                    />
                    {this.props.hasSourceEntryId && (
                        <FastField
                            label="Source entry ID"
                            name="caseReference.sourceEntryId"
                            type="text"
                            data-testid="sourceEntryId"
                            component={TextField}
                            fullWidth
                        />
                    )}
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
    name: string;
    origin: OriginData;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

interface SourceAutocompleteProps {
    initialValue?: CaseReference;
}

interface CaseReference extends CaseRef {
    inputValue?: string;
    sourceName?: string;
}

export async function submitSource(opts: {
    name: string;
    url: string;
}): Promise<CaseRef> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
        },
    };
    const resp = await axios.post<SourceData>('/api/sources', newSource);
    return {
        sourceId: resp.data._id,
        sourceUrl: opts.url,
        additionalSources: ([] as unknown) as [{ sourceUrl: string }],
    };
}

const filter = createFilterOptions<CaseReference>();

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const name = 'caseReference';
    const [value, setValue] = React.useState<CaseReference | null>(
        props.initialValue ? props.initialValue : null,
    );

    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<CaseReference[]>([]);
    const { setFieldValue, setTouched } = useFormikContext();

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

        fetch({ url: inputValue }, (results?: SourceData[]) => {
            if (active) {
                let newOptions = [] as CaseReference[];

                if (results) {
                    newOptions = [
                        ...newOptions,
                        ...results.map((source) => ({
                            sourceId: source._id,
                            sourceUrl: source.origin.url,
                            sourceName: source.name,
                            additionalSources: ([] as unknown) as [
                                { sourceUrl: string },
                            ],
                        })),
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
        <React.Fragment>
            <Autocomplete
                itemType="CaseReference"
                getOptionLabel={(option: CaseReference): string =>
                    option.sourceUrl
                }
                getOptionSelected={(
                    option: CaseReference,
                    value: CaseReference,
                ): boolean => {
                    return (
                        option.sourceId === value.sourceId &&
                        option.sourceUrl === value.sourceUrl
                    );
                }}
                onChange={(_: any, newValue: CaseReference | null): void => {
                    setValue(newValue);
                    setFieldValue(name, newValue);
                }}
                filterOptions={(
                    options: CaseReference[],
                    params,
                ): CaseReference[] => {
                    const filtered = filter(options, params) as CaseReference[];

                    if (
                        params.inputValue !== '' &&
                        !filtered.find(
                            (caseRef) =>
                                caseRef.sourceUrl === params.inputValue,
                        )
                    ) {
                        filtered.push({
                            inputValue: params.inputValue,
                            sourceUrl: params.inputValue,
                            sourceId: '',
                            sourceName: '',
                            additionalSources: ([] as unknown) as [
                                { sourceUrl: string },
                            ],
                        });
                    }

                    return filtered;
                }}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                options={options}
                value={value}
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
                            data-testid={name}
                            label="Source URL"
                            placeholder="https://..."
                            component={TextField}
                            fullWidth
                        ></Field>
                        <RequiredHelperText name={name}></RequiredHelperText>
                    </div>
                )}
                renderOption={(option: CaseReference): React.ReactNode => {
                    return (
                        <span>
                            <Typography variant="body2">
                                {option.sourceUrl}
                            </Typography>
                        </span>
                    );
                }}
            />
            {/* If this is a new source, show option to add name */}
            {inputValue &&
                !options.find((option) => option.sourceUrl === inputValue) && (
                    <>
                        <FastField
                            label="Source name"
                            name={`${name}.sourceName`}
                            type="text"
                            data-testid="sourceName"
                            component={TextField}
                            fullWidth
                        />
                    </>
                )}
        </React.Fragment>
    );
}

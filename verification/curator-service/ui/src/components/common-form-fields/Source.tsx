import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { FastField, Field, useFormikContext } from 'formik';
import { Typography, makeStyles } from '@material-ui/core';

import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import CaseFormValues from '../new-case-form-fields/CaseFormValues';
import { CaseReference } from '../Case';
import FieldTitle from './FieldTitle';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import axios from 'axios';
import { throttle } from 'lodash';

interface SourceProps {
    initialValue?: CaseReference;
    hasSourceEntryId?: boolean;
    freeSolo?: boolean;
}

// TODO: format this text to have newlines in it
const tooltipText =
    'Enter the URL of the data source used for reporting the line list case. ' +
    'If this is a new data source you will need to add it to the system along with a data source name. The form will prompt you to do this if this is the case. ' +
    'If the URL is an existing source already in the system, select the appropriate source from the list provided. ';

export default class Source extends React.Component<SourceProps, {}> {
    render(): JSX.Element {
        const freeSolo =
            this.props.freeSolo === undefined ? true : this.props.freeSolo;
        return (
            <Scroll.Element name="source">
                <FieldTitle
                    title="Data Source"
                    tooltip={freeSolo ? tooltipText : undefined}
                ></FieldTitle>
                <SourcesAutocomplete
                    initialValue={this.props.initialValue}
                    freeSolo={freeSolo}
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
    initialValue?: CaseReferenceForm;
    freeSolo: boolean;
}

export interface CaseReferenceForm extends CaseReference {
    inputValue?: string;
    sourceName?: string;
}

export async function submitSource(opts: {
    name: string;
    url: string;
    format?: string;
}): Promise<CaseReference> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
        },
        format: opts.format,
    };
    const resp = await axios.post<SourceData>('/api/sources', newSource);
    return {
        sourceId: resp.data._id,
        sourceUrl: opts.url,
        additionalSources: ([] as unknown) as [{ sourceUrl: string }],
    };
}

const filter = createFilterOptions<CaseReferenceForm>();

const useStyles = makeStyles(() => ({
    sourceNameField: {
        marginTop: '1em',
    },
}));

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const classes = useStyles();
    const name = 'caseReference';
    const [value, setValue] = React.useState<CaseReferenceForm | null>(
        props.initialValue ? props.initialValue : null,
    );

    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<CaseReferenceForm[]>([]);
    const { setFieldValue, setTouched, values } = useFormikContext<
        CaseFormValues | BulkCaseFormValues
    >();

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
                let newOptions = [] as CaseReferenceForm[];

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
                itemType="CaseReferenceForm"
                getOptionLabel={(option: CaseReferenceForm): string =>
                    // option is a string if the user typed a URL and did not
                    // select a dropdown value.
                    typeof option === 'string' ? option : option.sourceUrl
                }
                getOptionSelected={(
                    option: CaseReferenceForm,
                    value: CaseReferenceForm,
                ): boolean => {
                    return (
                        option.sourceId === value.sourceId &&
                        option.sourceUrl === value.sourceUrl
                    );
                }}
                onChange={(
                    _: any,
                    newValue: CaseReferenceForm | string | null,
                ): void => {
                    // newValue is a string if the user typed a URL and did not
                    // select a dropdown value.
                    if (typeof newValue === 'string') {
                        const existingOption = options.find(
                            (option) => option.sourceUrl === newValue,
                        );
                        newValue = existingOption ?? {
                            inputValue: newValue,
                            sourceUrl: newValue,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            additionalSources: ([] as unknown) as [
                                { sourceUrl: string },
                            ],
                        };
                    }
                    setValue(newValue);
                    setFieldValue(name, newValue);
                }}
                filterOptions={(
                    options: CaseReferenceForm[],
                    params,
                ): CaseReferenceForm[] => {
                    const filtered = filter(
                        options,
                        params,
                    ) as CaseReferenceForm[];

                    if (
                        params.inputValue !== '' &&
                        !filtered.find(
                            (caseRef) =>
                                caseRef.sourceUrl === params.inputValue,
                        ) &&
                        props.freeSolo
                    ) {
                        filtered.push({
                            inputValue: params.inputValue,
                            sourceUrl: params.inputValue,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            additionalSources: ([] as unknown) as [
                                { sourceUrl: string },
                            ],
                        });
                    }

                    return filtered;
                }}
                autoSelect
                freeSolo={props.freeSolo}
                selectOnFocus
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
                            label="Paste URL for data source or search"
                            placeholder="https://..."
                            component={TextField}
                            fullWidth
                        ></Field>
                        <RequiredHelperText name={name}></RequiredHelperText>
                    </div>
                )}
                renderOption={(option: CaseReferenceForm): React.ReactNode => {
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
                props.freeSolo &&
                !options.find((option) => option.sourceUrl === inputValue) && (
                    <>
                        <FastField
                            className={classes.sourceNameField}
                            label="Source name"
                            name={`${name}.sourceName`}
                            helperText="Required"
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

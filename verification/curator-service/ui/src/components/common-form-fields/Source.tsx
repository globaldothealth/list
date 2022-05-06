import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { FastField, Field, useFormikContext } from 'formik';
import { Typography } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import CaseFormValues from '../new-case-form-fields/CaseFormValues';
import { CaseReference } from '../../api/models/Case';
import FieldTitle from './FieldTitle';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { StyledTooltip } from '../new-case-form-fields/StyledTooltip';
import axios from 'axios';
import { throttle } from 'lodash';

interface SourceProps {
    initialValue?: CaseReference;
    hasSourceEntryId?: boolean;
    freeSolo?: boolean;
    sourcesWithStableIdentifiers?: boolean;
}

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>New data source:</strong> If this is a new data source
                you will need to add it to the system along with the data source
                name, license, and information about the provider. For example
                if the raw source was the “7th July Press Release from Honduras”
                the provider name would be the issuer of the press release e.g.
                “Honduras ministry of health”. The provider name needs to
                reflect the actual provider of the data, not the method of
                reporting. The source name can be anything informative to
                curators. The source URL should be a link to the data you’re
                uploading, while the provider website URL should link to an
                informative website.
            </li>
            <li>
                <strong>Existing data source:</strong> If the URL is an existing
                source already in the system, select the appropriate source from
                the list provided.
            </li>
        </ul>
    </StyledTooltip>
);

export default class Source extends React.Component<
    SourceProps,
    Record<string, unknown>
> {
    render(): JSX.Element {
        const freeSolo =
            this.props.freeSolo === undefined ? true : this.props.freeSolo;
        return (
            <Scroll.Element name="source">
                <FieldTitle
                    title="Data Source"
                    tooltip={<TooltipText />}
                ></FieldTitle>
                <SourcesAutocomplete
                    initialValue={this.props.initialValue}
                    freeSolo={freeSolo}
                    sourcesWithStableIdentifiers={
                        this.props.sourcesWithStableIdentifiers
                    }
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
    license: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}

interface SourceData {
    _id: string;
    name: string;
    origin: OriginData;
    hasStableIdentifiers?: boolean;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

export interface CaseReferenceForm extends CaseReference {
    inputValue?: string;
    sourceName?: string;
    sourceLicense?: string;
    sourceProviderName?: string;
    sourceProviderUrl?: string;
}

interface SourceAutocompleteProps {
    initialValue?: CaseReferenceForm;
    freeSolo: boolean;
    sourcesWithStableIdentifiers?: boolean;
}

export async function submitSource(opts: {
    name: string;
    url: string;
    license: string;
    format?: string;
    providerName?: string;
    providerWebsiteUrl?: string;
}): Promise<CaseReference> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
            license: opts.license,
            providerName: opts.providerName,
            providerWebsiteUrl: opts.providerWebsiteUrl,
        },
        format: opts.format,
    };
    const resp = await axios.post<SourceData>('/api/sources', newSource);
    return {
        sourceId: resp.data._id,
        sourceUrl: opts.url,
        additionalSources: [] as unknown as [{ sourceUrl: string }],
    };
}

const filter = createFilterOptions<CaseReferenceForm>();

const useStyles = makeStyles(() => ({
    sourceTextField: {
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
                    // this filtering could also be done server-side but there isn't a big number of sources
                    if (props.sourcesWithStableIdentifiers) {
                        callback(
                            resp.data.sources.filter((s) => {
                                return (
                                    s.hasStableIdentifiers === undefined ||
                                    s.hasStableIdentifiers === true
                                );
                            }),
                        );
                    } else {
                        callback(resp.data.sources);
                    }
                },
                250,
            ),
        [props.sourcesWithStableIdentifiers],
    );

    const sourceURLValidation = (str: string) => {
        if (str.length > 0) {
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' + // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                    '(\\#[-a-z\\d_]*)?$',
                'i',
            ); // fragment locator
            return !!pattern.test(str);
        } else {
            return true;
        }
    };

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
                            sourceLicense: source.origin.license,
                            sourceProviderName: source.origin.providerName,
                            sourceProviderUrl: source.origin.providerWebsiteUrl,
                            additionalSources: [] as unknown as [
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
                getOptionLabel={(option: string | CaseReferenceForm): string =>
                    // option is a string if the user typed a URL and did not
                    // select a dropdown value.
                    typeof option === 'string' ? option : option.sourceUrl
                }
                isOptionEqualToValue={(
                    option: CaseReferenceForm,
                    value: CaseReferenceForm,
                ): boolean => {
                    return (
                        option.sourceId === value.sourceId &&
                        option.sourceUrl === value.sourceUrl
                    );
                }}
                onChange={(
                    _: unknown,
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
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources: [] as unknown as [
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
                            sourceLicense:
                                values.caseReference?.sourceLicense ?? '',
                            sourceProviderName:
                                values.caseReference?.sourceProviderName ?? '',
                            sourceProviderUrl:
                                values.caseReference?.sourceProviderUrl ?? '',
                            additionalSources: [] as unknown as [
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
                        <RequiredHelperText
                            name={name}
                            wrongUrl={sourceURLValidation(inputValue)}
                        ></RequiredHelperText>
                    </div>
                )}
                renderOption={(
                    props,
                    option: CaseReferenceForm,
                ): React.ReactNode => {
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
                            className={classes.sourceTextField}
                            label="Source name"
                            name={`${name}.sourceName`}
                            helperText="Required"
                            type="text"
                            data-testid="sourceName"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source license"
                            name={`${name}.sourceLicense`}
                            helperText="Required"
                            type="text"
                            data-testid="sourceLicense"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source provider name"
                            name={`${name}.sourceProviderName`}
                            type="text"
                            data-testid="sourceProviderName"
                            component={TextField}
                            fullWidth
                        />
                        <FastField
                            className={classes.sourceTextField}
                            label="Source provider website"
                            name={`${name}.sourceProviderUrl`}
                            type="text"
                            data-testid="sourceProviderUrl"
                            component={TextField}
                            fullWidth
                        />
                    </>
                )}
        </React.Fragment>
    );
}

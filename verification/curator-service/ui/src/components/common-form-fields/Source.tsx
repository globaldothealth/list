import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@material-ui/core';
import { FastField, Field, useFormikContext } from 'formik';

import { CaseReference as CaseRef } from '../Case';
import FieldTitle from './FieldTitle';
import { TextField as MUITextField } from '@material-ui/core';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
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
    origin: OriginData;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

interface SourceAutocompleteProps {
    initialValue?: CaseReference;
}

interface AdditionalSource {
    sourceUrl: string;
}

interface CaseReference extends CaseRef {
    inputValue?: string;
}

const filter = createFilterOptions<CaseReference>();

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const name = 'caseReference';
    const [open, toggleOpen] = React.useState(false);
    const [value, setValue] = React.useState<CaseReference | null>(
        props.initialValue ? props.initialValue : null,
    );
    const [dialogValue, setDialogValue] = React.useState({
        url: '',
        name: '',
    });

    const handleClose = (): void => {
        setDialogValue({
            url: '',
            name: '',
        });
        toggleOpen(false);
    };

    const handleDialogSubmit = async (): Promise<void> => {
        const newSource = {
            name: dialogValue.name,
            origin: {
                url: dialogValue.url,
            },
        };
        const resp = await axios.post<SourceData>('/api/sources', newSource);
        const newValue = {
            sourceId: resp.data._id,
            sourceUrl: dialogValue.url,
            additionalSources: ([] as unknown) as [{ sourceUrl: string }],
        };

        setValue(newValue);
        setFieldValue(name, newValue);
        handleClose();
    };

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
                onChange={(
                    event: any,
                    newValue: CaseReference | null,
                ): void => {
                    if (typeof newValue === 'string') {
                        // Timeout to avoid instant validation of the dialog's form.
                        setTimeout(() => {
                            toggleOpen(true);
                            setDialogValue({
                                url: newValue,
                                name: '',
                            });
                        });
                    } else if (newValue && newValue.inputValue) {
                        toggleOpen(true);
                        setDialogValue({
                            url: newValue.inputValue,
                            name: '',
                        });
                    } else {
                        setValue(newValue);
                        setFieldValue(name, newValue);
                    }
                }}
                filterOptions={(
                    options: CaseReference[],
                    params,
                ): CaseReference[] => {
                    const filtered = filter(options, params) as CaseReference[];

                    if (params.inputValue !== '') {
                        filtered.push({
                            inputValue: params.inputValue,
                            sourceUrl: `Add "${params.inputValue}"`,
                            sourceId: '',
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
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="form-dialog-title"
            >
                <form>
                    <DialogTitle id="form-dialog-title">
                        Add a new source
                    </DialogTitle>
                    <DialogContent>
                        <MUITextField
                            autoFocus
                            margin="dense"
                            id="url"
                            value={dialogValue.url}
                            onChange={(event): void =>
                                setDialogValue({
                                    ...dialogValue,
                                    url: event.target.value,
                                })
                            }
                            label="URL"
                            type="text"
                        />
                        <MUITextField
                            margin="dense"
                            id="name"
                            value={dialogValue.name}
                            onChange={(event): void =>
                                setDialogValue({
                                    ...dialogValue,
                                    name: event.target.value,
                                })
                            }
                            label="Name"
                            type="text"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            Cancel
                        </Button>
                        {
                            // Don't use submit type for this button.
                            // It'll trigger the outer form submit.
                            // We could make this dialog use a nested Formik
                            // declaration/context, but no need for now.
                        }
                        <Button
                            onClick={handleDialogSubmit}
                            color="primary"
                            data-testid="sourceAdd"
                        >
                            Add
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </React.Fragment>
    );
}

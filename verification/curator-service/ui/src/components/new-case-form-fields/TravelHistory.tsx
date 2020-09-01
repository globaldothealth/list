import {
    DateField,
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';
import { FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import CancelIcon from '@material-ui/icons/Cancel';
import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import Location from './Location';
import { PlacesAutocomplete } from './LocationForm';
import React from 'react';
import Scroll from 'react-scroll';
import { makeStyles } from '@material-ui/core';
import shortId from 'shortid';

const useStyles = makeStyles(() => ({
    travelLocationTitle: {
        alignItems: 'center',
        display: 'flex',
    },
    spacer: {
        flex: '1',
    },
    fieldRow: {
        marginBottom: '2em',
    },
    fieldRowTop: {
        marginTop: '2em',
    },
}));

const hasTravelledValues = ['Unknown', 'Yes', 'No'];

// If changing this list, also modify https://github.com/globaldothealth/list/blob/main/data-serving/data-service/api/openapi.yaml
const travelPurposes = ['Unknown', 'Business', 'Leisure', 'Family', 'Other'];

const travelMethods = [
    'Bus',
    'Car',
    'Coach',
    'Ferry',
    'Plane',
    'Train',
    'Other',
];

export default function Events(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="travelHistory">
            <FieldTitle title="Travel History"></FieldTitle>
            <SelectField
                name={`traveledPrior30Days`}
                label="Travelled in the last 30 days"
                values={hasTravelledValues}
            ></SelectField>
            {values.traveledPrior30Days === 'Yes' && (
                <FieldArray name="travelHistory">
                    {({ push, remove }): JSX.Element => {
                        return (
                            <div>
                                {values.travelHistory &&
                                    values.travelHistory.map(
                                        (travelHistoryElement, index) => {
                                            return (
                                                <div
                                                    key={
                                                        travelHistoryElement.reactId
                                                    }
                                                    data-testid={
                                                        'travel-history-section'
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            classes.travelLocationTitle
                                                        }
                                                    >
                                                        {`Travel location ${
                                                            index + 1
                                                        }`}
                                                        <span
                                                            className={
                                                                classes.spacer
                                                            }
                                                        ></span>
                                                        <Button
                                                            startIcon={
                                                                <CancelIcon />
                                                            }
                                                            data-testid={
                                                                'remove-travel-history-button'
                                                            }
                                                            onClick={(): void => {
                                                                remove(index);
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                    <PlacesAutocomplete
                                                        initialValue={
                                                            initialValues
                                                                .travelHistory[
                                                                index
                                                            ]?.location?.name
                                                        }
                                                        name={`travelHistory[${index}].location`}
                                                    ></PlacesAutocomplete>
                                                    {travelHistoryElement.location && (
                                                        <Location
                                                            locationPath={`travelHistory[${index}].location`}
                                                            geometry={
                                                                values
                                                                    .travelHistory[
                                                                    index
                                                                ]?.location
                                                                    ?.geometry
                                                            }
                                                        ></Location>
                                                    )}
                                                    <div
                                                        className={
                                                            classes.fieldRowTop
                                                        }
                                                    >
                                                        <DateField
                                                            name={`travelHistory[${index}].dateRange.start`}
                                                            label="Start date"
                                                            initialFocusedDate={
                                                                values.confirmedDate
                                                            }
                                                        ></DateField>
                                                    </div>
                                                    <DateField
                                                        name={`travelHistory[${index}].dateRange.end`}
                                                        label="End date"
                                                        initialFocusedDate={
                                                            values.confirmedDate
                                                        }
                                                    ></DateField>
                                                    <SelectField
                                                        name={`travelHistory[${index}].purpose`}
                                                        label="Primary reason for travel"
                                                        values={travelPurposes}
                                                    ></SelectField>
                                                    <div
                                                        className={
                                                            classes.fieldRow
                                                        }
                                                    >
                                                        <FormikAutocomplete
                                                            name={`travelHistory[${index}].methods`}
                                                            label="Methods of travel"
                                                            initialValue={
                                                                initialValues
                                                                    .travelHistory[
                                                                    index
                                                                ]?.methods
                                                            }
                                                            multiple
                                                            freeSolo
                                                            optionsList={
                                                                travelMethods
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}

                                <Button
                                    data-testid="addTravelHistory"
                                    startIcon={<AddCircleIcon />}
                                    onClick={(): void => {
                                        push({
                                            reactId: shortId.generate(),
                                            dateRange: {
                                                start: null,
                                                end: null,
                                            },
                                        });
                                    }}
                                >
                                    Add travel location
                                </Button>
                            </div>
                        );
                    }}
                </FieldArray>
            )}
        </Scroll.Element>
    );
}

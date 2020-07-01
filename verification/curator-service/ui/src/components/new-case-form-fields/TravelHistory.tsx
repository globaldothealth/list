import { DateField, SelectField } from '../common-form-fields/FormikFields';
import { FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import CancelIcon from '@material-ui/icons/Cancel';
import CaseFormValues from './CaseFormValues';
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
}));

const hasTravelledValues = [undefined, 'Yes', 'No'];

// TODO: get values from DB.
const travelPurposes = [undefined, 'Business', 'Leisure', 'Family', 'Other'];

const travelMethods = [
    undefined,
    'Bus',
    'Car',
    'Coach',
    'Ferry',
    'Plane',
    'Train',
    'Other',
];

export default function Events(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="travelHistory">
            <fieldset>
                <legend>Travel History</legend>
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
                                                                    remove(
                                                                        index,
                                                                    );
                                                                }}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        <PlacesAutocomplete
                                                            name={`travelHistory[${index}].location`}
                                                        ></PlacesAutocomplete>
                                                        <Location
                                                            location={
                                                                travelHistoryElement.location
                                                            }
                                                        ></Location>
                                                        <DateField
                                                            name={`travelHistory[${index}].dateRange.start`}
                                                            label="Start date"
                                                        ></DateField>
                                                        <DateField
                                                            name={`travelHistory[${index}].dateRange.end`}
                                                            label="End date"
                                                        ></DateField>
                                                        <SelectField
                                                            name={`travelHistory[${index}].purpose`}
                                                            label="Primary reason for travel"
                                                            values={
                                                                travelPurposes
                                                            }
                                                        ></SelectField>
                                                        <SelectField
                                                            name={`travelHistory[${index}].method`}
                                                            label="Method of travel"
                                                            values={
                                                                travelMethods
                                                            }
                                                        ></SelectField>
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
            </fieldset>
        </Scroll.Element>
    );
}

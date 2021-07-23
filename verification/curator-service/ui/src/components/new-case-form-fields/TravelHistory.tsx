import React from 'react';
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
import { StyledTooltip } from './StyledTooltip';
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

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Travelled in the last 30 days:</strong> Enter if the
                source reports the case travelled in the 30 days prior to
                confirmation.
                <ul>
                    <li>
                        If you select yes then you will be able to fill in more
                        details as to the location and details of the travel,
                        duration and purpose.
                    </li>
                    <li>
                        If the source does not provide information on if the
                        case traveled in the previous 30 days select unknown.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Add travel location:</strong> Enter the location of
                travel for each reported destination.
                <ul>
                    <li>
                        Location is entered using the same rules as location for
                        the case, allowing a depth of location to Admin level 1,
                        2 or 3. Enter the level of depth the source provides.
                    </li>
                    <li>
                        If no specific location information is provided do not
                        add a travel location but complete the 'Travelled in the
                        last 30 days' field as 'yes'.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Start date:</strong> Enter the date travel at the
                location started
            </li>
            <li>
                <strong>End date:</strong> Enter the date travel at the location
                ended
            </li>
            <li>
                <strong>Primary reason for travel:</strong> Enter the primary
                reason for travel:
                <ul>
                    <li>
                        <strong>Business:</strong> The case was traveling on
                        business
                    </li>
                    <li>
                        <strong>Lesiure:</strong> The case was traveling for
                        leisure purposes e.g. holiday
                    </li>
                    <li>
                        <strong>Family:</strong> The case was traveling to meet
                        family
                    </li>
                    <li>
                        <strong>Other:</strong> Another reason for travel
                    </li>
                    <li>
                        <strong>Unknown:</strong> The reason for travel was not
                        reported or unknown
                    </li>
                </ul>
            </li>
            <li>
                <strong>Methods of travel:</strong> Enter the method for travel
                if known:
                <ul>
                    <li>Bus</li>
                    <li>Car</li>
                    <li>Coach</li>
                    <li>Ferry</li>
                    <li>Plane</li>
                    <li>Train</li>
                    <li>Other</li>
                </ul>
            </li>
        </ul>
    </StyledTooltip>
);

export default function Events(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="travelHistory">
            <FieldTitle
                title="Travel History"
                tooltip={<TooltipText />}
            ></FieldTitle>
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

import { FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import Location from './Location';
import NewCaseFormValues from './NewCaseFormValues';
import { PlacesAutocomplete } from './LocationForm';
import React from 'react';
import Scroll from 'react-scroll';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    travelHistorySection: {
        margin: '1em',
    },
}));

export default function Events(): JSX.Element {
    const { values } = useFormikContext<NewCaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="travelHistory">
            <fieldset>
                <legend>Travel History</legend>
                <FieldArray name="travelHistory">
                    {({ push }): JSX.Element => {
                        return (
                            <div>
                                {values.travelHistory &&
                                    values.travelHistory.map(
                                        (travelHistoryElement, index) => (
                                            <fieldset
                                                key={index}
                                                className={
                                                    classes.travelHistorySection
                                                }
                                            >
                                                <PlacesAutocomplete
                                                    name={`travelHistory[${index}]`}
                                                ></PlacesAutocomplete>
                                                <Location
                                                    location={
                                                        travelHistoryElement
                                                    }
                                                ></Location>
                                            </fieldset>
                                        ),
                                    )}

                                <Button
                                    data-testid="addTravelHistory"
                                    startIcon={<AddCircleIcon />}
                                    onClick={(): void => {
                                        push({});
                                    }}
                                >
                                    Add travel history
                                </Button>
                            </div>
                        );
                    }}
                </FieldArray>
            </fieldset>
        </Scroll.Element>
    );
}

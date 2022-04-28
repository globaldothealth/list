import React from 'react';
import { FastField, FieldArray, useFormikContext } from 'formik';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Button from '@mui/material/Button';
import CancelIcon from '@mui/icons-material/Cancel';
import CaseFormValues from './CaseFormValues';
import {
    DateField,
    FormikAutocomplete,
} from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import makeStyles from '@mui/styles/makeStyles';
import shortId from 'shortid';
import { VaccineSideEffects } from './Symptoms';

const TooltipText = () => (
    <StyledTooltip>
        <p>
            You can enter the name and batch ID of the vaccine administered, and
            date the patient was vaccinated. If any side-effects were reported,
            you can provide a list of these using the same data dictionary as
            for disease symptoms.
        </p>
        <p>
            You can also indicate, for each dose of vaccine, whether the patient
            was previously infected and, if so, the detection method.
        </p>
    </StyledTooltip>
);

const useStyles = makeStyles(() => ({
    vaccineTitle: {
        alignItems: 'left',
    },
    spacer: {
        flex: '1',
    },
    field: {
        marginBottom: '1em',
        marginLeft: '1em',
        marginRight: '1em',
    },
}));

export default function Vaccines(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    const classes = useStyles();
    return (
        <Scroll.Element name="vaccines">
            <FieldTitle
                title="Vaccines"
                interactive
                tooltip={<TooltipText />}
            ></FieldTitle>
            <FieldArray name="vaccines">
                {({ push, remove }): JSX.Element => {
                    return (
                        <div>
                            {values.vaccines &&
                                values.vaccines.map((vaccine, index) => (
                                    <div
                                        key={vaccine.reactId}
                                        data-testid={'vaccine-section'}
                                    >
                                        <div className={classes.vaccineTitle}>
                                            {`Vaccine ${index + 1}`}
                                            <span
                                                className={classes.spacer}
                                            ></span>
                                            <Button
                                                startIcon={<CancelIcon />}
                                                data-testid={
                                                    'remove-vaccine-button'
                                                }
                                                onClick={(): void => {
                                                    remove(index);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                            <DateField
                                                name={`vaccines[${index}].date`}
                                                label="Vaccination date"
                                            ></DateField>
                                            <FastField
                                                className={classes.field}
                                                name={`vaccines[${index}].name`}
                                                type="text"
                                                label="Vaccine Name"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <FastField
                                                className={classes.field}
                                                name={`vaccines[${index}].batch`}
                                                type="text"
                                                label="Vaccine Batch ID"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <FormikAutocomplete
                                                name={`vaccines[${index}].previousInfection`}
                                                label="Previous Infection?"
                                                multiple={false}
                                                optionsList={[
                                                    'Yes',
                                                    'No',
                                                    'NA',
                                                ]}
                                                initialValue={
                                                    vaccine.previousInfection
                                                }
                                            />
                                            <FastField
                                                className={classes.field}
                                                name={`vaccines[${index}].previousInfectionDetectionMethod`}
                                                type="text"
                                                label="Detection Method for Previous Infection"
                                                fullWidth
                                                component={TextField}
                                            ></FastField>
                                            <VaccineSideEffects i={index} />
                                        </div>
                                    </div>
                                ))}
                            <Button
                                data-testid="addVaccine"
                                startIcon={<AddCircleIcon />}
                                onClick={(): void => {
                                    push({
                                        reactId: shortId.generate(),
                                        name: '',
                                        batch: null,
                                        date: new Date(),
                                        sideEffects: [],
                                        sideEffectsStatus: 'Asymptomatic',
                                        previousInfection: 'NA',
                                        previousInfectionDetectionMethod: null,
                                    });
                                }}
                            >
                                Add vaccine
                            </Button>
                        </div>
                    );
                }}
            </FieldArray>
        </Scroll.Element>
    );
}

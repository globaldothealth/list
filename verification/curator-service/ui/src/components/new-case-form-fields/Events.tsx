import { Field, useFormikContext } from 'formik';

import DateFnsUtils from '@date-io/date-fns';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import Scroll from 'react-scroll';
import { Select } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    fieldRow: {
        marginBottom: '2em',
        width: '100%',
    },
    field: {
        width: '50%',
    },
}));

interface DateFieldProps {
    name: string;
    label: string;
}

function DateField(props: DateFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <div className={classes.fieldRow}>
            <Field
                className={classes.field}
                name={props.name}
                label={props.label}
                format="yyyy/MM/dd"
                maxDate={new Date()}
                minDate={new Date('2019/12/01')}
                component={KeyboardDatePicker}
            />
        </div>
    );
}

interface SelectFieldProps {
    name: string;
    label: string;
    values: (string | undefined)[];
}

function SelectField(props: SelectFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <FormControl className={classes.fieldRow}>
            <InputLabel htmlFor={props.name}>{props.label}</InputLabel>
            <Field
                as="select"
                name={props.name}
                type="text"
                data-testid={props.name}
                className={classes.field}
                component={Select}
            >
                {props.values.map((value) => (
                    <MenuItem key={value ?? 'undefined'} value={value}>
                        {value}
                    </MenuItem>
                ))}
            </Field>
        </FormControl>
    );
}

const yesNoUndefined = [undefined, 'Yes', 'No'];

// TODO: get values from DB.
const methodsOfConfirmation = [
    undefined,
    'PCR test',
    'Serological test',
    'Clinical diagnosis',
    'Other',
];

const outcomes = [undefined, 'Death', 'Recovered'];

export default function Events(): JSX.Element {
    const { values } = useFormikContext();
    return (
        <Scroll.Element name="events">
            <fieldset>
                <legend>Events</legend>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <DateField
                        name="confirmedDate"
                        label="Confirmed case date"
                    ></DateField>
                    <SelectField
                        name="methodOfConfirmation"
                        label="Method of confirmation"
                        values={methodsOfConfirmation}
                    ></SelectField>
                    <DateField
                        name="onsetSymptomsDate"
                        label="Onset of symptoms date"
                    ></DateField>
                    <DateField
                        name="firstClinicalConsultationDate"
                        label="First clinical consultation date"
                    ></DateField>
                    <DateField
                        name="selfIsolationDate"
                        label="Self isolation date"
                    ></DateField>
                    <SelectField
                        name="admittedToHospital"
                        label="Hospital admission"
                        values={yesNoUndefined}
                    ></SelectField>
                    {(values as any).admittedToHospital === 'Yes' && (
                        <DateField
                            name="hospitalAdmissionDate"
                            label="Hospital admission date"
                        ></DateField>
                    )}
                    <DateField
                        name="icuAdmissionDate"
                        label="ICU admission date"
                    ></DateField>
                    <DateField
                        name="outcomeDate"
                        label="Outcome date'"
                    ></DateField>
                    <SelectField
                        name="outcome"
                        label="Outcome"
                        values={outcomes}
                    ></SelectField>
                </MuiPickersUtilsProvider>
            </fieldset>
        </Scroll.Element>
    );
}

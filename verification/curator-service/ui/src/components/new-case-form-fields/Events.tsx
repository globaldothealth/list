import { DateField, SelectField } from './FormikFields';

import NewCaseFormValues from './NewCaseFormValues';
import React from 'react';
import Scroll from 'react-scroll';
import { useFormikContext } from 'formik';

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
    const { values } = useFormikContext<NewCaseFormValues>();
    return (
        <Scroll.Element name="events">
            <fieldset>
                <legend>Events</legend>
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
                {values.admittedToHospital === 'Yes' && (
                    <DateField
                        name="hospitalAdmissionDate"
                        label="Hospital admission date"
                    ></DateField>
                )}
                <DateField
                    name="icuAdmissionDate"
                    label="ICU admission date"
                ></DateField>
                <SelectField
                    name="outcome"
                    label="Outcome"
                    values={outcomes}
                ></SelectField>
                {values.outcome !== undefined && (
                    <DateField
                        name="outcomeDate"
                        label="Outcome date"
                    ></DateField>
                )}
            </fieldset>
        </Scroll.Element>
    );
}

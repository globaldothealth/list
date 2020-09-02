import { DateField, SelectField } from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { useFormikContext } from 'formik';

const yesNoUndefined = ['Unknown', 'Yes', 'No'];

const methodsOfConfirmation = [
    'Unknown',
    'PCR test',
    'Serological test',
    'Clinical diagnosis',
    'Other',
];

const outcomes = ['Unknown', 'Death', 'Recovered'];

export default function Events(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="events">
            <FieldTitle title="Events"></FieldTitle>
            <DateField
                name="confirmedDate"
                label="Confirmed case date"
                required
            ></DateField>
            <SelectField
                name="methodOfConfirmation"
                label="Method of confirmation"
                values={methodsOfConfirmation}
            ></SelectField>
            <DateField
                name="onsetSymptomsDate"
                label="Onset of symptoms date"
                initialFocusedDate={values.confirmedDate}
            ></DateField>
            <DateField
                name="firstClinicalConsultationDate"
                label="First clinical consultation date"
                initialFocusedDate={values.confirmedDate}
            ></DateField>
            <DateField
                name="selfIsolationDate"
                label="Self isolation date"
                initialFocusedDate={values.confirmedDate}
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
                    initialFocusedDate={values.confirmedDate}
                ></DateField>
            )}
            <SelectField
                name="admittedToIcu"
                label="ICU admission"
                values={yesNoUndefined}
            ></SelectField>
            {values.admittedToIcu === 'Yes' && (
                <DateField
                    name="icuAdmissionDate"
                    label="ICU admission date"
                    initialFocusedDate={values.confirmedDate}
                ></DateField>
            )}
            <SelectField
                name="outcome"
                label="Outcome"
                values={outcomes}
            ></SelectField>
            {values.outcome !== undefined && values.outcome !== 'Unknown' && (
                <DateField
                    name="outcomeDate"
                    label="Outcome date"
                    initialFocusedDate={values.confirmedDate}
                ></DateField>
            )}
        </Scroll.Element>
    );
}

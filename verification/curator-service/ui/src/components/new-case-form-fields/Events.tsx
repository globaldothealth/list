import { DateField, SelectField } from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
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

const TooltipText = () => (
    <StyledTooltip>
      <ul>
        <li><strong>Confirmed case date:</strong> Enter the date the case was confirmed.
          <ul>
            <li>This is a required field so a date must be provided to submit the entry.</li>
            <li>If the data source does not provide a date for when the case was confirmed, then the date of case reporting will be used instead. If there is no date of confirmed case please enter the date the source reports the case instead.</li>
          </ul>
        </li>
        <li><strong>Method of confirmation:</strong> Provide the type of method used to confirm the case. If there is no method provided selected unknown.
          <ul>
            <li><strong>PCR test:</strong> Confirms if the virus is currently present in the person.</li>
            <li><strong>Serological test:</strong> Confirms if there is a presence of antibodies in the person, indicating the virus has previously been present.</li>
            <li><strong>Clinical diagnosis:</strong> A diagnosis is made on the basis of medical signs and reported symptoms that the person has the virus.</li>
            <li><strong>Other:</strong> Another method was used to confirm the virus is/was present.</li>
            <li><strong>Unknown:</strong> The method used to confirm the case was not reported in the source.</li>
          </ul>
        </li>
        <li><strong>Onset of symptoms date:</strong> Enter the date if reported for the onset of symptoms.  Leave blank if not reported.</li>
        <li><strong>First clinical consultation date:</strong> Enter the date of the first clinical consultation of any type reported by the patient.
          <ul>
            <li>This could be visiting a doctor or nurse or calling a healthcare helpline to report their symptoms / condition.</li>
            <li>If no clinical consultation was sought, or the source does not provide any details, leave blank.</li>
          </ul>
        </li>
        <li><strong>Self isolation date:</strong> Enter the date the case went into self isolation.
          <ul>
            <li>If the case did not go into self isolation, or the source does not report the information, leave blank.</li>
          </ul>
        </li>
        <li><strong>Hospital admission:</strong> Enter if the case was admitted to hospital.</li>
        <li>If the case did not get admitted to hospital or the source does not provide any information leave blank.</li>
        <li><strong>ICU admission:</strong> Enter if the case was admitted to ICU ward.</li>
        <li>If the case did not get admitted to ICU or the source does not provide any information leave blank.</li>
        <li><strong>Outcome:</strong> Enter the outcome of the case</li>
        <li>If the source does not provide any information enter unknown.</li>
        <li>This is a required field so must be entered</li>
      </ul>
    </StyledTooltip>
);

export default function Events(): JSX.Element {
    const { values } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="events">
            <FieldTitle
              title="Events"
              tooltip={<TooltipText />}
            ></FieldTitle>
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

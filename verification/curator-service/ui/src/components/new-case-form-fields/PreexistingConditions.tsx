import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import { SelectField } from '../common-form-fields/FormikFields';
import { useFormikContext } from 'formik';

const hasPreexistingConditionsValues = ['Unknown', 'Yes', 'No'];

const TooltipText = () => (
  <StyledTooltip>
    <ul>
      <li><strong>Has pre existing conditions:</strong> Enter if the case has reported pre existing conditions If none reported leave blank.</li>
      <li><strong>Pre existing conditions:</strong> Select the pre existing conditions reported for the case.
        <ul>
          <li>You can either manually search in the field by typing and selecting each from the prepopulated list or click the most common populated below.</li>
          <li>You can select multiple pre existing conditions per case.</li>
        </ul>
      </li>
    </ul>
  </StyledTooltip>
);

export default function PreexistingConditions(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="preexistingConditions">
            <FieldTitle
              title="Pre-existing conditions"
              tooltip={<TooltipText />}
            >
            </FieldTitle>
            <SelectField
                name="hasPreexistingConditions"
                label="Has preexisting conditions"
                values={hasPreexistingConditionsValues}
            ></SelectField>
            {values.hasPreexistingConditions === 'Yes' && (
                <FormikAutocomplete
                    name="preexistingConditions"
                    label="Preexisting conditions"
                    initialValue={initialValues.preexistingConditions}
                    multiple
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/preexisting_conditions.txt"
                />
            )}
        </Scroll.Element>
    );
}

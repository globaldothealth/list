import CaseFormValues from './CaseFormValues';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import React from 'react';
import Scroll from 'react-scroll';
import { SelectField } from '../common-form-fields/FormikFields';
import { useFormikContext } from 'formik';

const hasPreexistingConditionsValues = [undefined, 'Yes', 'No'];
export default function PreexistingConditions(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="preexistingConditions">
            <fieldset>
                <legend>Pre-existing conditions</legend>
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
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/preexisting_conditions.txt"
                    />
                )}
            </fieldset>
        </Scroll.Element>
    );
}

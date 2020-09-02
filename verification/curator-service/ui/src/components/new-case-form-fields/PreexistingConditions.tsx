import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import React from 'react';
import Scroll from 'react-scroll';
import { SelectField } from '../common-form-fields/FormikFields';
import { useFormikContext } from 'formik';

const hasPreexistingConditionsValues = ['Unknown', 'Yes', 'No'];
export default function PreexistingConditions(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="preexistingConditions">
            <FieldTitle title="Pre-existing conditions"></FieldTitle>
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

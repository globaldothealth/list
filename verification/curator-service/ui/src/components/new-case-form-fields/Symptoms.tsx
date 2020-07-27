import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { useFormikContext } from 'formik';

// TODO: get values from DB
const symptomStatusValues = [
    undefined,
    'Asymptomatic',
    'Symptomatic',
    'Presymptomatic',
];

export default function Symptoms(): JSX.Element {
    const { values, initialValues } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="symptoms">
            <fieldset>
                <FieldTitle title="Symptoms"></FieldTitle>
                <SelectField
                    name="symptomsStatus"
                    label="Symptom status"
                    values={symptomStatusValues}
                ></SelectField>
                {(values.symptomsStatus === 'Symptomatic' ||
                    values.symptomsStatus === 'Presymptomatic') && (
                    <FormikAutocomplete
                        name="symptoms"
                        label="Symptoms"
                        initialValue={initialValues.symptoms}
                        multiple
                        optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt"
                    />
                )}
            </fieldset>
        </Scroll.Element>
    );
}

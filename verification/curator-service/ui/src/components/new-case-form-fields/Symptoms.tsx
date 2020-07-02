import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import React from 'react';
import Scroll from 'react-scroll';
import { useFormikContext } from 'formik';

// TODO: get symptoms from DB
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
                <legend>Symptoms</legend>
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
                        multiple={true}
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/symptoms.txt"
                    />
                )}
            </fieldset>
        </Scroll.Element>
    );
}

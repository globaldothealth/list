import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import NewCaseFormValues from './NewCaseFormValues';
import React from 'react';
import Scroll from 'react-scroll';
import { useFormikContext } from 'formik';

export default function Symptoms(): JSX.Element {
    const { initialValues } = useFormikContext<NewCaseFormValues>();
    return (
        <Scroll.Element name="symptoms">
            <fieldset>
                <legend>Symptoms</legend>
                <FormikAutocomplete
                    name="symptoms"
                    label="Symptoms"
                    initialValue={initialValues.symptoms}
                    multiple={true}
                    optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/symptoms.txt"
                />
            </fieldset>
        </Scroll.Element>
    );
}

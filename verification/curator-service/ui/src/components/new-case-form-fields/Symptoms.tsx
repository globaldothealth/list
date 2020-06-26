import { FormikAutocomplete } from './FormikFields';
import React from 'react';
import Scroll from 'react-scroll';

export default class Symptoms extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="symptoms">
                <fieldset>
                    <legend>Symptoms</legend>
                    <FormikAutocomplete
                        name="symptoms"
                        label="Symptoms"
                        multiple={true}
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/symptoms.txt"
                    />
                </fieldset>
            </Scroll.Element>
        );
    }
}

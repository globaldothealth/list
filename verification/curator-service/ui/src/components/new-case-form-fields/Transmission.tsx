import CaseFormValues from './CaseFormValues';
import ChipInput from 'material-ui-chip-input';
import FieldTitle from '../common-form-fields/FieldTitle';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import React from 'react';
import Scroll from 'react-scroll';
import { makeStyles } from '@material-ui/core';
import { useFormikContext } from 'formik';

const useStyles = makeStyles(() => ({
    fieldRow: {
        marginBottom: '2em',
        width: '100%',
    },
}));

interface SelectFieldProps {
    name: string;
    label: string;
    values: (string | undefined)[];
}

export default function Transmission(): JSX.Element {
    const { setFieldValue, setTouched, initialValues } = useFormikContext<
        CaseFormValues
    >();
    const classes = useStyles();
    return (
        <Scroll.Element name="transmission">
            <fieldset>
                <FieldTitle title="Transmission"></FieldTitle>
                <div className={classes.fieldRow}>
                    <FormikAutocomplete
                        name="transmissionRoutes"
                        freeSolo
                        label="Route of transmission"
                        initialValue={initialValues.transmissionRoutes}
                        multiple
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/main/suggest/route_of_transmission.txt"
                    />
                </div>
                <div className={classes.fieldRow}>
                    <FormikAutocomplete
                        name="transmissionPlaces"
                        freeSolo
                        label="Places of transmission"
                        initialValue={initialValues.transmissionPlaces}
                        multiple
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/main/suggest/place_of_transmission.txt"
                    />
                </div>
                <ChipInput
                    fullWidth
                    alwaysShowPlaceholder
                    placeholder="Contacted case IDs"
                    defaultValue={initialValues.transmissionLinkedCaseIds}
                    onBlur={(): void =>
                        setTouched({ transmissionLinkedCaseIds: true })
                    }
                    onChange={(values): void => {
                        setFieldValue(
                            'transmissionLinkedCaseIds',
                            values ?? undefined,
                        );
                    }}
                ></ChipInput>
            </fieldset>
        </Scroll.Element>
    );
}

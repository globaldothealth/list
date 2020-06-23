import { Field, useFormikContext } from 'formik';

import ChipInput from 'material-ui-chip-input';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import Scroll from 'react-scroll';
import { Select } from 'formik-material-ui';
import { makeStyles } from '@material-ui/core';

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

function SelectField(props: SelectFieldProps): JSX.Element {
    const classes = useStyles();
    return (
        <FormControl className={classes.fieldRow}>
            <InputLabel htmlFor={props.name}>{props.label}</InputLabel>
            <Field
                as="select"
                name={props.name}
                type="text"
                data-testid={props.name}
                component={Select}
            >
                {props.values.map((value) => (
                    <MenuItem key={value ?? 'undefined'} value={value}>
                        {value}
                    </MenuItem>
                ))}
            </Field>
        </FormControl>
    );
}

// TODO: get values from DB.
const transmissionRoutes = [
    undefined,
    'Airborne infection',
    'Droplet infection',
    'Fecal–oral',
    'Sexual',
    'Oral',
    'Direct contact',
    'Vertical',
    'Iatrogenic',
    'Vector borne',
    'Other',
];

const transmissionPlaces = [
    undefined,
    'Assisted Living',
    'Bar / Pub',
    'Building site',
    'Conference',
    'Elderly Care',
    'Factory',
    'Food Processing Plant',
    'Funeral',
    'Gym',
    'Hospital',
    'Hotel',
    'Household',
    'Large shared accomodation',
    'Long Term Acute Care',
    'Long Term Care Facility',
    'Nighclub',
    'Office',
    'Prison',
    'Public Space',
    'Restaurant',
    'Religous place of worship',
    'School',
    'Ship',
    'Shopping',
    'Sport event',
    'Warehouse',
    'Wedding',
    'Work',
    'Other',
];

export default function Transmission(): JSX.Element {
    const { setFieldValue, setTouched } = useFormikContext();
    return (
        <Scroll.Element name="transmission">
            <fieldset>
                <legend>Transmission</legend>
                <SelectField
                    name="transmissionRoute"
                    label="Route of transmission"
                    values={transmissionRoutes}
                ></SelectField>
                <SelectField
                    name="transmissionPlace"
                    label="Place of transmission"
                    values={transmissionPlaces}
                ></SelectField>
                <ChipInput
                    fullWidth
                    alwaysShowPlaceholder
                    placeholder="Contacted case IDs"
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

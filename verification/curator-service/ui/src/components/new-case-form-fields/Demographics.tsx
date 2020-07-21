import { FastField, useFormikContext } from 'formik';
import { Select, TextField } from 'formik-material-ui';

import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import FormControl from '@material-ui/core/FormControl';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import Scroll from 'react-scroll';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';

const styles = () =>
    createStyles({
        fieldRow: {
            marginBottom: '2em',
        },
        ageRow: {
            alignItems: 'baseline',
            display: 'flex',
        },
        ageField: {
            width: '8em',
        },
        ageSeparator: {
            margin: '0 2em',
        },
        select: {
            width: '8em',
        },
    });

type DemographicsProps = WithStyles<typeof styles>;

// TODO: get values from DB.
const genderValues = [
    undefined,
    'Male',
    'Female',
    'Non-binary/Third gender',
    'Other',
];

function Demographics(props: DemographicsProps): JSX.Element {
    const { classes } = props;
    const { initialValues } = useFormikContext<CaseFormValues>();
    return (
        <Scroll.Element name="demographics">
            <fieldset>
                <FieldTitle title="Demographics"></FieldTitle>
                <FormControl>
                    <div className={classes.fieldRow}>
                        <InputLabel htmlFor="gender">Gender</InputLabel>
                        <FastField
                            as="select"
                            name="gender"
                            type="text"
                            data-testid="gender"
                            className={classes.select}
                            component={Select}
                        >
                            {genderValues.map((gender) => (
                                <MenuItem
                                    key={gender ?? 'undefined'}
                                    value={gender}
                                >
                                    {gender ?? 'Unknown'}
                                </MenuItem>
                            ))}
                        </FastField>
                    </div>
                </FormControl>
                <div className={`${classes.fieldRow} ${classes.ageRow}`}>
                    <FastField
                        className={classes.ageField}
                        name="minAge"
                        type="number"
                        label="Min age"
                        component={TextField}
                    ></FastField>
                    <span className={classes.ageSeparator}>to</span>
                    <FastField
                        className={classes.ageField}
                        name="maxAge"
                        type="number"
                        label="Max age"
                        component={TextField}
                    ></FastField>
                    <span className={classes.ageSeparator}>or</span>
                    <FastField
                        className={classes.ageField}
                        name="age"
                        type="number"
                        label="Age"
                        component={TextField}
                    ></FastField>
                </div>
                <div className={classes.fieldRow}>
                    <FastField
                        label="Race / Ethnicity"
                        name="ethnicity"
                        type="text"
                        data-testid="ethnicity"
                        component={TextField}
                        fullWidth
                    />
                </div>
                <div className={classes.fieldRow}>
                    <FormikAutocomplete
                        name="nationalities"
                        label="Nationality"
                        initialValue={initialValues.nationalities}
                        multiple={true}
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/main/suggest/nationalities.txt"
                    />
                </div>
                <FormikAutocomplete
                    name="occupation"
                    label="Occupation"
                    initialValue={initialValues.occupation}
                    multiple={false}
                    freeSolo
                    optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/main/suggest/occupations.txt"
                />
            </fieldset>
        </Scroll.Element>
    );
}

export default withStyles(styles)(Demographics);

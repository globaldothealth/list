import { FastField, useFormikContext } from 'formik';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
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

// If changing this list, also modify https://github.com/globaldothealth/list/blob/main/data-serving/data-service/api/openapi.yaml
const genderValues = [
    'Unknown',
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
                <SelectField
                    name="gender"
                    label="Gender"
                    values={genderValues}
                ></SelectField>
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
                        optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/nationalities.txt"
                    />
                </div>
                <FormikAutocomplete
                    name="occupation"
                    label="Occupation"
                    initialValue={initialValues.occupation}
                    multiple={false}
                    freeSolo
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/occupations.txt"
                />
            </fieldset>
        </Scroll.Element>
    );
}

export default withStyles(styles)(Demographics);

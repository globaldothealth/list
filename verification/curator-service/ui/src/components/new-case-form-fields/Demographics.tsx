import { FastField, useFormikContext } from 'formik';
import { Select, TextField } from 'formik-material-ui';

import FormControl from '@material-ui/core/FormControl';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import NewCaseFormValues from './NewCaseFormValues';
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
const sexValues = [undefined, 'Male', 'Female'];

const ethnicityValues = [
    undefined,
    'Asian',
    'Black',
    'Latino',
    'Multi-race',
    'White',
    'Other',
];

function Demographics(props: DemographicsProps): JSX.Element {
    const { classes } = props;
    const { initialValues } = useFormikContext<NewCaseFormValues>();
    return (
        <Scroll.Element name="demographics">
            <fieldset>
                <legend>Demographics</legend>
                <FormControl>
                    <div className={classes.fieldRow}>
                        <InputLabel htmlFor="sex">Sex</InputLabel>
                        <FastField
                            as="select"
                            name="sex"
                            type="text"
                            data-testid="sex"
                            className={classes.select}
                            component={Select}
                        >
                            {sexValues.map((sex) => (
                                <MenuItem key={sex ?? 'undefined'} value={sex}>
                                    {sex ?? 'Unknown'}
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
                    <FormControl>
                        <InputLabel htmlFor="ethnicity">Ethnicity</InputLabel>
                        <FastField
                            as="select"
                            name="ethnicity"
                            type="text"
                            data-testid="ethnicity"
                            className={classes.select}
                            component={Select}
                        >
                            {ethnicityValues.map((ethnicity) => (
                                <MenuItem
                                    key={ethnicity ?? 'undefined'}
                                    value={ethnicity}
                                >
                                    {ethnicity ?? 'Unknown'}
                                </MenuItem>
                            ))}
                        </FastField>
                    </FormControl>
                </div>
                <div className={classes.fieldRow}>
                    <FormikAutocomplete
                        name="nationalities"
                        label="Nationality"
                        initialValue={initialValues.nationalities}
                        multiple={true}
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/nationalities.txt"
                    />
                </div>
                <FormikAutocomplete
                    name="profession"
                    label="Profession"
                    initialValue={initialValues.profession}
                    multiple={false}
                    optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/professions.txt"
                />
            </fieldset>
        </Scroll.Element>
    );
}

export default withStyles(styles)(Demographics);

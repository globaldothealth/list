import { Select, TextField } from 'formik-material-ui';

import { Field } from 'formik';
import FormControl from '@material-ui/core/FormControl';
import { FormikAutocomplete } from './FormikFields';
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
const sexes = [
    ['Unknown', undefined],
    ['Female', 'Female'],
    ['Male', 'Male'],
];

const ethnicityValues = [
    undefined,
    'Asian',
    'Black',
    'Latino',
    'Multi-race',
    'White',
    'Other',
];

class Demographics extends React.Component<DemographicsProps, {}> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Scroll.Element name="demographics">
                <fieldset>
                    <legend>Demographics</legend>
                    <FormControl>
                        <div className={classes.fieldRow}>
                            <InputLabel htmlFor="sex">Sex</InputLabel>
                            <Field
                                as="select"
                                name="sex"
                                type="text"
                                data-testid="sex"
                                className={classes.select}
                                component={Select}
                            >
                                {sexes.map((v) => (
                                    <MenuItem key={v[0]} value={v[1]}>
                                        {v[0]}
                                    </MenuItem>
                                ))}
                            </Field>
                        </div>
                    </FormControl>
                    <div className={`${classes.fieldRow} ${classes.ageRow}`}>
                        <Field
                            className={classes.ageField}
                            name="minAge"
                            type="number"
                            label="Min age"
                            component={TextField}
                        ></Field>
                        <span className={classes.ageSeparator}>to</span>
                        <Field
                            className={classes.ageField}
                            name="maxAge"
                            type="number"
                            label="Max age"
                            component={TextField}
                        ></Field>
                        <span className={classes.ageSeparator}>or</span>
                        <Field
                            className={classes.ageField}
                            name="age"
                            type="number"
                            label="Age"
                            component={TextField}
                        ></Field>
                    </div>
                    <div className={classes.fieldRow}>
                        <FormControl>
                            <InputLabel htmlFor="ethnicity">
                                Ethnicity
                            </InputLabel>
                            <Field
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
                                        {ethnicity}
                                    </MenuItem>
                                ))}
                            </Field>
                        </FormControl>
                    </div>
                    <div className={classes.fieldRow}>
                        <FormikAutocomplete
                            name="nationalities"
                            label="Nationality"
                            multiple={true}
                            optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/nationalities.txt"
                        />
                    </div>
                    <FormikAutocomplete
                        name="profession"
                        label="Profession"
                        multiple={false}
                        optionsLocation="https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/professions.txt"
                    />
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default withStyles(styles)(Demographics);

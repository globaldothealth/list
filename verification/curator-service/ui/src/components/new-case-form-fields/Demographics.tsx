import { Select, TextField } from 'formik-material-ui';

import { Field } from 'formik';
import FormControl from '@material-ui/core/FormControl';
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

type Props = WithStyles<typeof styles>;

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
class Demographics extends React.Component<Props, {}> {
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
                                {sexValues.map((sex) => (
                                    <MenuItem
                                        key={sex ?? 'undefined'}
                                        value={sex}
                                    >
                                        {sex}
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
                    <div>
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
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default withStyles(styles)(Demographics);

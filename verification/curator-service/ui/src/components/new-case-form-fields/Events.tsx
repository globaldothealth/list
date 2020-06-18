import DateFnsUtils from '@date-io/date-fns';
import { Field } from 'formik';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import Scroll from 'react-scroll';
import { Select } from 'formik-material-ui';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';

const styles = () =>
    createStyles({
        fieldRow: {
            marginBottom: '2em',
            width: '100%',
        },
        field: {
            width: '50%',
        },
    });

type Props = WithStyles<typeof styles>;

// TODO: get values from DB.
const methodsOfConfirmation = [
    undefined,
    'PCR test',
    'Serological test',
    'Clinical diagnosis',
    'Other',
];

const outcomes = [undefined, 'Death', 'Recovered'];

class Events extends React.Component<Props, {}> {
    dateField(name: string, label: string): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.fieldRow}>
                <Field
                    className={classes.field}
                    name={name}
                    label={label}
                    format="yyyy/MM/dd"
                    maxDate={new Date()}
                    minDate={new Date('2019/12/01')}
                    component={KeyboardDatePicker}
                />
            </div>
        );
    }

    selectField(
        name: string,
        label: string,
        values: (string | undefined)[],
    ): JSX.Element {
        const { classes } = this.props;
        return (
            <FormControl className={classes.fieldRow}>
                <InputLabel htmlFor={name}>{label}</InputLabel>
                <Field
                    as="select"
                    name={name}
                    type="text"
                    data-testid={name}
                    className={classes.field}
                    component={Select}
                >
                    {values.map((value) => (
                        <MenuItem key={value ?? 'undefined'} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                </Field>
            </FormControl>
        );
    }

    render(): JSX.Element {
        return (
            <Scroll.Element name="events">
                <fieldset>
                    <legend>Events</legend>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        {this.dateField('confirmedDate', 'Confirmed case date')}
                        {this.selectField(
                            'methodOfConfirmation',
                            'Method of confirmation',
                            methodsOfConfirmation,
                        )}
                        {this.dateField(
                            'onsetSymptomsDate',
                            'Onset of symptoms date',
                        )}
                        {this.dateField(
                            'firstClinicalConsultationDate',
                            'First clinical consultation date',
                        )}
                        {this.dateField(
                            'selfIsolationDate',
                            'Self isolation date',
                        )}
                        {this.dateField(
                            'hospitalAdmissionDate',
                            'Hospital admission date',
                        )}
                        {this.dateField(
                            'icuAdmissionDate',
                            'ICU admission date',
                        )}
                        {this.dateField('outcomeDate', 'Outcome date')}
                        {this.selectField('outcome', 'Outcome', outcomes)}
                    </MuiPickersUtilsProvider>
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default withStyles(styles)(Events);

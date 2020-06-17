import DateFnsUtils from '@date-io/date-fns';
import { Field } from 'formik';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
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
        field: {
            width: '50%',
        },
    });

type Props = WithStyles<typeof styles>;

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

    render(): JSX.Element {
        return (
            <Scroll.Element name="events">
                <fieldset>
                    <legend>Events</legend>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        {this.dateField('confirmedDate', 'Confirmed case date')}
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
                    </MuiPickersUtilsProvider>
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default withStyles(styles)(Events);

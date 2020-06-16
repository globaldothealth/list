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
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Scroll.Element name="events">
                <fieldset>
                    <legend>Events</legend>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="confirmedDate"
                                label="Confirmed case date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="onsetSymptomsDate"
                                label="Onset of symptoms date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="firstClinicalConsultationDate"
                                label="First clinical consultation date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="selfIsolationDate"
                                label="Self isolation date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="hospitalAdmissionDate"
                                label="Hospital admission date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <div className={classes.fieldRow}>
                            <Field
                                className={classes.field}
                                name="icuAdmissionDate"
                                label="ICU admission date"
                                format="yyyy/MM/dd"
                                maxDate={new Date()}
                                minDate={new Date('2019/12/01')}
                                component={KeyboardDatePicker}
                            />
                        </div>
                        <Field
                            className={classes.field}
                            name="outcomeDate"
                            label="Outcome date"
                            format="yyyy/MM/dd"
                            maxDate={new Date()}
                            minDate={new Date('2019/12/01')}
                            component={KeyboardDatePicker}
                        />
                    </MuiPickersUtilsProvider>
                </fieldset>
            </Scroll.Element>
        );
    }
}

export default withStyles(styles)(Events);

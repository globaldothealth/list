import DateFnsUtils from '@date-io/date-fns';
import { Field } from 'formik';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import Scroll from 'react-scroll';

export default class Events extends React.Component<{}, {}> {
    render(): JSX.Element {
        return (
            <Scroll.Element name="events">
                <fieldset>
                    <legend>Events</legend>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Field
                            name="confirmedDate"
                            label="Date confirmed"
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

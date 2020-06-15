import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { Select, TextField } from 'formik-material-ui';
import { Theme, createStyles } from '@material-ui/core/styles';
import { green, grey, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import DateFnsUtils from '@date-io/date-fns';
import ErrorIcon from '@material-ui/icons/Error';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import MenuItem from '@material-ui/core/MenuItem';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { withStyles } from '@material-ui/core';

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

const styles = (theme: Theme) =>
    createStyles({
        container: {
            display: 'flex',
        },
        tableOfContents: {
            position: 'fixed',
        },
        tableOfContentsRow: {
            alignItems: 'center',
            display: 'flex',
        },
        form: {
            paddingLeft: '15em',
            width: '60%',
        },
    });

interface Props extends WithStyles<typeof styles> {
    user: User;
}

interface NewCaseFormState {
    errorMessage: string;
}

interface FormValues {
    sex?: string;
    country: string;
    confirmedDate: string | null;
    sourceUrl: string;
    notes: string;
}

class NewCaseForm extends React.Component<Props, NewCaseFormState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            errorMessage: '',
        };
    }

    async submitCase(values: FormValues): Promise<void> {
        try {
            await axios.post('/api/cases', {
                demographics: {
                    sex: values.sex,
                },
                location: {
                    country: values.country,
                    // TODO: Infer the geo resolution from the location.
                    geoResolution: 'Admin0',
                },
                events: {
                    name: 'confirmed',
                    dateRange: {
                        start: values.confirmedDate,
                    },
                },
                sources: [
                    {
                        url: values.sourceUrl,
                    },
                ],
                notes: values.notes,
                revisionMetadata: {
                    revisionNumber: 0,
                    creationMetadata: {
                        curator: this.props.user.email,
                        date: new Date().toISOString(),
                    },
                },
            });
            this.setState({ errorMessage: '' });
        } catch (e) {
            if (e.response) {
                this.setState({ errorMessage: e.response.data.message });
            } else if (e.request) {
                this.setState({ errorMessage: e.request });
            } else {
                this.setState({ errorMessage: e.message });
            }
        }
    }

    tableOfContentsIcon(opts: {
        isChecked: boolean;
        hasError: boolean;
    }): JSX.Element {
        return opts.hasError ? (
            <ErrorIcon
                data-testid="error-icon"
                style={{
                    color: red[500],
                    margin: '0.25em 0.5em',
                }}
            ></ErrorIcon>
        ) : opts.isChecked ? (
            <CheckCircleIcon
                data-testid="check-icon"
                style={{
                    color: green[500],
                    margin: '0.25em 0.5em',
                }}
            ></CheckCircleIcon>
        ) : (
            <RadioButtonUncheckedIcon
                style={{
                    color: grey[500],
                    margin: '0.25em 0.5em',
                }}
            ></RadioButtonUncheckedIcon>
        );
    }

    scrollTo(name: string): void {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            offset: -64, // Account for header height
        });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Formik
                initialValues={{
                    sex: undefined,
                    country: '',
                    confirmedDate: null,
                    sourceUrl: '',
                    notes: '',
                }}
                onSubmit={(values, errors) => this.submitCase(values)}
            >
                {({
                    submitForm,
                    isSubmitting,
                    values,
                    errors,
                }): JSX.Element => (
                    <div className={classes.container}>
                        <nav className={classes.tableOfContents}>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void =>
                                    this.scrollTo('demographics')
                                }
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.sex !== undefined,
                                    hasError: errors.sex !== undefined,
                                })}
                                Demographics
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('location')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.country.trim() !== '',
                                    hasError: errors.country !== undefined,
                                })}
                                Location
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('events')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.confirmedDate !== null,
                                    hasError:
                                        errors.confirmedDate !== undefined,
                                })}
                                Events
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('source')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.sourceUrl.trim() !== '',
                                    hasError: errors.sourceUrl !== undefined,
                                })}
                                Source
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('notes')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.notes.trim() !== '',
                                    hasError: errors.notes !== undefined,
                                })}
                                Notes
                            </div>
                        </nav>
                        <div className={classes.form}>
                            <Form>
                                <Scroll.Element name="demographics">
                                    <fieldset>
                                        <legend>Demographics</legend>
                                        <FormControl>
                                            <InputLabel htmlFor="sex">
                                                Sex
                                            </InputLabel>
                                            <Field
                                                as="select"
                                                name="sex"
                                                type="text"
                                                component={Select}
                                            >
                                                <MenuItem
                                                    value={undefined}
                                                ></MenuItem>
                                                <MenuItem value={'Female'}>
                                                    Female
                                                </MenuItem>
                                                <MenuItem value={'Male'}>
                                                    Male
                                                </MenuItem>
                                            </Field>
                                        </FormControl>
                                    </fieldset>
                                </Scroll.Element>
                                <Scroll.Element name="location">
                                    <fieldset>
                                        <legend>Location</legend>
                                        <Field
                                            label="Country"
                                            name="country"
                                            type="text"
                                            component={TextField}
                                        />
                                    </fieldset>
                                </Scroll.Element>
                                <Scroll.Element name="events">
                                    <fieldset>
                                        <legend>Events</legend>
                                        <MuiPickersUtilsProvider
                                            utils={DateFnsUtils}
                                        >
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
                                <Scroll.Element name="source">
                                    <fieldset>
                                        <legend>Source</legend>
                                        <Field
                                            label="Source URL"
                                            name="sourceUrl"
                                            type="text"
                                            placeholder="https://..."
                                            component={TextField}
                                        />
                                    </fieldset>
                                </Scroll.Element>
                                <Scroll.Element name="notes">
                                    <fieldset>
                                        <legend>Notes</legend>
                                        <Field
                                            label="Notes"
                                            name="notes"
                                            type="text"
                                            component={TextField}
                                        />
                                    </fieldset>
                                </Scroll.Element>
                                {isSubmitting && <LinearProgress />}
                                <br />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    data-testid="submit"
                                    disabled={isSubmitting}
                                    onClick={submitForm}
                                >
                                    Submit case
                                </Button>
                                {this.state.errorMessage && (
                                    <h3>{this.state.errorMessage as string}</h3>
                                )}
                            </Form>
                        </div>
                    </div>
                )}
            </Formik>
        );
    }
}

export default withStyles(styles, { withTheme: true })(NewCaseForm);

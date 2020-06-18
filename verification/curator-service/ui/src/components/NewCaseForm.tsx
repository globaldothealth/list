import * as Yup from 'yup';

import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { green, grey, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@material-ui/icons/Error';
import Events from './new-case-form-fields/Events';
import Notes from './new-case-form-fields/Notes';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Source from './new-case-form-fields/Source';
import { TextField } from 'formik-material-ui';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core';

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
}

const styles = () =>
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
    minAge?: number;
    maxAge?: number;
    age?: number;
    ethnicity?: string;
    nationalities: string[];
    locationQuery: string;
    confirmedDate: string | null;
    methodOfConfirmation?: string;
    onsetSymptomsDate: string | null;
    firstClinicalConsultationDate: string | null;
    selfIsolationDate: string | null;
    hospitalAdmissionDate: string | null;
    icuAdmissionDate: string | null;
    outcomeDate: string | null;
    outcome?: string;
    sourceUrl: string;
    notes: string;
}

const NewCaseValidation = Yup.object().shape(
    {
        minAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('maxAge', {
                is: (maxAge) => maxAge !== undefined && maxAge !== '',
                then: Yup.number().required('Must enter minimum age in range'),
            }),
        maxAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge) => minAge !== undefined && minAge !== '',
                then: Yup.number().required('Must enter maximum age in range'),
            }),
        age: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge) => minAge !== undefined && minAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            })
            .when('maxAge', {
                is: (maxAge) => maxAge !== undefined && maxAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            }),
    },
    [['maxAge', 'minAge']],
);

class NewCaseForm extends React.Component<Props, NewCaseFormState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            errorMessage: '',
        };
    }

    async submitCase(values: FormValues): Promise<void> {
        const ageRange = values.age
            ? { start: values.age, end: values.age }
            : { start: values.minAge, end: values.maxAge };
        try {
            await axios.post('/api/cases', {
                demographics: {
                    sex: values.sex,
                    ageRange: ageRange,
                    ethnicity: values.ethnicity,
                    nationalities: values.nationalities,
                },
                location: {
                    query: values.locationQuery,
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: values.confirmedDate,
                            end: values.confirmedDate,
                        },
                        value: values.methodOfConfirmation,
                    },
                    {
                        name: 'onsetSymptoms',
                        dateRange: {
                            start: values.onsetSymptomsDate,
                            end: values.onsetSymptomsDate,
                        },
                    },
                    {
                        name: 'firstClinicalConsultation',
                        dateRange: {
                            start: values.firstClinicalConsultationDate,
                            end: values.firstClinicalConsultationDate,
                        },
                    },
                    {
                        name: 'selfIsolation',
                        dateRange: {
                            start: values.selfIsolationDate,
                            end: values.selfIsolationDate,
                        },
                    },
                    {
                        name: 'hospitalAdmission',
                        dateRange: {
                            start: values.hospitalAdmissionDate,
                            end: values.hospitalAdmissionDate,
                        },
                    },
                    {
                        name: 'icuAdmission',
                        dateRange: {
                            start: values.icuAdmissionDate,
                            end: values.icuAdmissionDate,
                        },
                    },
                    {
                        name: 'outcome',
                        dateRange: {
                            start: values.outcomeDate,
                            end: values.outcomeDate,
                        },
                        value: values.outcome,
                    },
                ],
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
                    minAge: undefined,
                    maxAge: undefined,
                    age: undefined,
                    ethnicity: undefined,
                    nationalities: [],
                    locationQuery: '',
                    confirmedDate: null,
                    methodOfConfirmation: undefined,
                    onsetSymptomsDate: null,
                    firstClinicalConsultationDate: null,
                    selfIsolationDate: null,
                    hospitalAdmissionDate: null,
                    icuAdmissionDate: null,
                    outcomeDate: null,
                    outcome: undefined,
                    sourceUrl: '',
                    notes: '',
                }}
                validationSchema={NewCaseValidation}
                onSubmit={(values) => this.submitCase(values)}
            >
                {({
                    submitForm,
                    setFieldValue,
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
                                    isChecked:
                                        values.sex !== undefined ||
                                        (values.age !== undefined &&
                                            values.age !== '') ||
                                        (values.minAge !== undefined &&
                                            values.minAge !== '' &&
                                            values.maxAge !== undefined &&
                                            values.maxAge !== '') ||
                                        values.ethnicity !== undefined ||
                                        values.nationalities.length > 0,
                                    hasError:
                                        errors.sex !== undefined ||
                                        errors.minAge !== undefined ||
                                        errors.maxAge !== undefined ||
                                        errors.age !== undefined ||
                                        errors.ethnicity !== undefined ||
                                        errors.nationalities !== undefined,
                                })}
                                Demographics
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('location')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked:
                                        values.locationQuery.trim() !== '',
                                    hasError:
                                        errors.locationQuery !== undefined,
                                })}
                                Location
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('events')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked:
                                        values.confirmedDate !== null ||
                                        values.methodOfConfirmation !==
                                            undefined ||
                                        values.onsetSymptomsDate !== null ||
                                        values.firstClinicalConsultationDate !==
                                            null ||
                                        values.selfIsolationDate !== null ||
                                        values.hospitalAdmissionDate !== null ||
                                        values.icuAdmissionDate !== null ||
                                        values.outcomeDate !== null ||
                                        values.outcome !== undefined,
                                    hasError:
                                        errors.confirmedDate !== undefined ||
                                        errors.methodOfConfirmation !==
                                            undefined ||
                                        errors.onsetSymptomsDate !==
                                            undefined ||
                                        errors.firstClinicalConsultationDate !==
                                            undefined ||
                                        errors.selfIsolationDate !==
                                            undefined ||
                                        errors.hospitalAdmissionDate !==
                                            undefined ||
                                        errors.icuAdmissionDate !== undefined ||
                                        errors.outcomeDate !== undefined ||
                                        errors.outcome !== undefined,
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
                                <Demographics
                                    setFieldValue={setFieldValue}
                                ></Demographics>
                                <Scroll.Element name="location">
                                    <fieldset>
                                        <legend>Location</legend>
                                        <Field
                                            label="Location"
                                            name="locationQuery"
                                            type="text"
                                            component={TextField}
                                        />
                                    </fieldset>
                                </Scroll.Element>
                                <Events></Events>
                                <Source></Source>
                                <Notes></Notes>
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

export default withStyles(styles)(NewCaseForm);

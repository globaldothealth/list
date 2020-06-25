import * as Yup from 'yup';

import { Button, LinearProgress } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { green, grey, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@material-ui/icons/Error';
import Events from './new-case-form-fields/Events';
import LocationForm from './new-case-form-fields/LocationForm';
import NewCaseFormValues from './new-case-form-fields/NewCaseFormValues';
import Notes from './new-case-form-fields/Notes';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Source from './new-case-form-fields/Source';
import Symptoms from './new-case-form-fields/Symptoms';
import Transmission from './new-case-form-fields/Transmission';
import TravelHistory from './new-case-form-fields/TravelHistory';
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
        },
    });

interface Props extends WithStyles<typeof styles> {
    user: User;
}

interface NewCaseFormState {
    errorMessage: string;
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
        transmissionLinkedCaseIds: Yup.array().of(
            Yup.string().matches(new RegExp('[a-z0-9]{24}'), 'Invalid case ID'),
        ),
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

    async submitCase(values: NewCaseFormValues): Promise<void> {
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
                    profession: values.profession,
                },
                location: values.location,
                events: [
                    {
                        name: 'confirmed',
                        dates: values.confirmedDate,
                        value: values.methodOfConfirmation,
                    },
                    {
                        name: 'onsetSymptoms',
                        dates: values.onsetSymptomsDate,
                        value: undefined,
                    },
                    {
                        name: 'firstClinicalConsultation',
                        dates: values.firstClinicalConsultationDate,
                        value: undefined,
                    },
                    {
                        name: 'selfIsolation',
                        dates: values.selfIsolationDate,
                        value: undefined,
                    },
                    {
                        name: 'hospitalAdmission',
                        dates:
                            values.admittedToHospital === 'Yes'
                                ? values.hospitalAdmissionDate
                                : undefined,
                        value: values.admittedToHospital,
                    },
                    {
                        name: 'icuAdmission',
                        dates: values.icuAdmissionDate,
                        value: undefined,
                    },
                    {
                        name: 'outcome',
                        dates:
                            values.outcome !== undefined
                                ? values.outcomeDate
                                : undefined,
                        value: values.outcome,
                    },
                ]
                    .filter((elem) => elem.dates !== null)
                    .map((elem) => {
                        return {
                            name: elem.name,
                            dateRange: {
                                start: elem.dates,
                                end: elem.dates,
                            },
                            value: elem.value,
                        };
                    }),
                symptoms: {
                    values: values.symptoms,
                },
                transmission: {
                    routes: values.transmissionRoutes,
                    places: values.transmissionPlaces,
                    linkedCaseIds: values.transmissionLinkedCaseIds,
                },
                sources: [
                    {
                        url: values.sourceUrl,
                    },
                ],
                travelHistory: {
                    travel: values.travelHistory,
                },
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
                this.setState({ errorMessage: e.response.data });
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
                    profession: undefined,
                    location: undefined,
                    confirmedDate: null,
                    methodOfConfirmation: undefined,
                    onsetSymptomsDate: null,
                    firstClinicalConsultationDate: null,
                    selfIsolationDate: null,
                    admittedToHospital: undefined,
                    hospitalAdmissionDate: null,
                    icuAdmissionDate: null,
                    outcomeDate: null,
                    outcome: undefined,
                    symptoms: [],
                    transmissionRoutes: [],
                    transmissionPlaces: [],
                    transmissionLinkedCaseIds: [],
                    travelHistory: [],
                    sourceUrl: '',
                    notes: '',
                }}
                validationSchema={NewCaseValidation}
                onSubmit={(values) => this.submitCase(values)}
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
                                    isChecked:
                                        values.sex !== undefined ||
                                        (values.age !== undefined &&
                                            values.age !== '') ||
                                        (values.minAge !== undefined &&
                                            values.minAge !== '' &&
                                            values.maxAge !== undefined &&
                                            values.maxAge !== '') ||
                                        values.ethnicity !== undefined ||
                                        values.nationalities.length > 0 ||
                                        values.profession !== undefined,
                                    hasError:
                                        errors.sex !== undefined ||
                                        errors.minAge !== undefined ||
                                        errors.maxAge !== undefined ||
                                        errors.age !== undefined ||
                                        errors.ethnicity !== undefined ||
                                        errors.nationalities !== undefined ||
                                        errors.profession !== undefined,
                                })}
                                Demographics
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('location')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked:
                                        values.location !== null &&
                                        values.location !== undefined,
                                    hasError: errors.location !== undefined,
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
                                        values.admittedToHospital !==
                                            undefined ||
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
                                        errors.admittedToHospital !==
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
                                onClick={(): void => this.scrollTo('symptoms')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.symptoms.length > 0,
                                    hasError: errors.symptoms !== undefined,
                                })}
                                Symptoms
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void =>
                                    this.scrollTo('transmission')
                                }
                            >
                                {this.tableOfContentsIcon({
                                    isChecked:
                                        values.transmissionRoutes.length > 0 ||
                                        values.transmissionPlaces.length > 0 ||
                                        values.transmissionLinkedCaseIds
                                            .length > 0,
                                    hasError:
                                        errors.transmissionRoutes !==
                                            undefined ||
                                        errors.transmissionPlaces !==
                                            undefined ||
                                        errors.transmissionLinkedCaseIds !==
                                            undefined,
                                })}
                                Transmission
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void =>
                                    this.scrollTo('travelHistory')
                                }
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.travelHistory.length > 0,
                                    hasError:
                                        errors.travelHistory !== undefined,
                                })}
                                Travel History
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
                                <Demographics></Demographics>
                                <LocationForm></LocationForm>
                                <Events></Events>
                                <Symptoms></Symptoms>
                                <Transmission></Transmission>
                                <TravelHistory></TravelHistory>
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

import * as Yup from 'yup';

import { Button, LinearProgress } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { green, grey, red } from '@material-ui/core/colors';

import { Case } from './Case';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@material-ui/icons/Error';
import Events from './new-case-form-fields/Events';
import GenomeSequences from './new-case-form-fields/GenomeSequences';
import LocationForm from './new-case-form-fields/LocationForm';
import MuiAlert from '@material-ui/lab/Alert';
import NewCaseFormValues from './new-case-form-fields/NewCaseFormValues';
import Notes from './new-case-form-fields/Notes';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Source from './common-form-fields/Source';
import Symptoms from './new-case-form-fields/Symptoms';
import Transmission from './new-case-form-fields/Transmission';
import TravelHistory from './new-case-form-fields/TravelHistory';
import User from './User';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import axios from 'axios';
import { createStyles } from '@material-ui/core/styles';
import { hasKey } from './Utils';
import shortId from 'shortid';
import { withStyles } from '@material-ui/core';

const styles = () =>
    createStyles({
        container: {
            display: 'flex',
        },
        tableOfContents: {
            position: 'fixed',
            marginTop: '2em',
        },
        tableOfContentsRow: {
            alignItems: 'center',
            display: 'flex',
        },
        form: {
            paddingLeft: '15em',
        },
        formSection: {
            margin: '2em 0',
        },
    });

function initialValuesFromCase(c?: Case): NewCaseFormValues {
    if (!c) {
        return {
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
            traveledPrior30Days: undefined,
            travelHistory: [],
            genomeSequences: [],
            sourceUrl: '',
            notes: '',
        };
    }
    return {
        sex: c.demographics?.sex,
        minAge:
            c.demographics?.ageRange?.start !== c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.start
                : undefined,
        maxAge:
            c.demographics?.ageRange?.start !== c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.end
                : undefined,
        age:
            c.demographics?.ageRange?.start === c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.start
                : undefined,
        ethnicity: c.demographics?.ethnicity,
        nationalities: c.demographics?.nationalities,
        profession: c.demographics?.profession,
        location: c.location,
        confirmedDate:
            c.events.find((event) => event.name === 'confirmed')?.dateRange
                ?.start || null,
        methodOfConfirmation: c.events.find(
            (event) => event.name === 'confirmed',
        )?.value,
        onsetSymptomsDate:
            c.events.find((event) => event.name === 'onsetSymptoms')?.dateRange
                ?.start || null,
        firstClinicalConsultationDate:
            c.events.find((event) => event.name === 'firstClinicalConsultation')
                ?.dateRange?.start || null,
        selfIsolationDate:
            c.events.find((event) => event.name === 'selfIsolation')?.dateRange
                ?.start || null,
        admittedToHospital: c.events.find(
            (event) => event.name === 'hospitalAdmission',
        )?.value,
        hospitalAdmissionDate:
            c.events.find((event) => event.name === 'hospitalAdmission')
                ?.dateRange?.start || null,
        icuAdmissionDate:
            c.events.find((event) => event.name === 'icuAdmission')?.dateRange
                ?.start || null,
        outcomeDate:
            c.events.find((event) => event.name === 'outcome')?.dateRange
                ?.start || null,
        outcome: c.events.find((event) => event.name === 'outcome')?.value,
        symptoms: c.symptoms?.values,
        transmissionRoutes: c.transmission?.routes,
        transmissionPlaces: c.transmission?.places,
        transmissionLinkedCaseIds: c.transmission?.linkedCaseIds,
        traveledPrior30Days:
            c.travelHistory?.traveledPrior30Days === undefined
                ? undefined
                : c.travelHistory.traveledPrior30Days
                ? 'Yes'
                : 'No',
        travelHistory: c.travelHistory?.travel?.map((travel) => {
            return { reactId: shortId.generate(), ...travel };
        }),
        genomeSequences: c.genomeSequences?.map((genomeSequence) => {
            return { reactId: shortId.generate(), ...genomeSequence };
        }),
        sourceUrl: c.sources?.length > 0 ? c.sources[0].url : '',
        notes: c.notes,
    };
}

interface Props extends WithStyles<typeof styles> {
    user: User;
    initialCase?: Case;
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
                then: Yup.number()
                    .min(
                        Yup.ref('minAge'),
                        'Max age must be greater than than min age',
                    )
                    .required('Must enter maximum age in range'),
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
        confirmedDate: Yup.string().nullable().required('Required field'),
        location: Yup.object().required('Required field'),
        methodOfConfirmation: Yup.string().required('Required field'),
        sourceUrl: Yup.string().required('Required field'),
    },
    [['maxAge', 'minAge']],
);

function hasErrors(fields: string[], errors: any, touched: any): boolean {
    for (const field of fields) {
        if (
            hasKey(touched, field) &&
            touched[field] &&
            hasKey(errors, field) &&
            errors[field] !== undefined
        ) {
            return true;
        }
    }
    return false;
}

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
        const newCase = {
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
                traveledPrior30Days:
                    values.traveledPrior30Days === 'Yes'
                        ? true
                        : values.traveledPrior30Days === 'No'
                        ? false
                        : undefined,
                travel: values.travelHistory,
            },
            genomeSequences: values.genomeSequences,
            notes: values.notes,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: this.props.user.email,
                    date: new Date().toISOString(),
                },
            },
        };
        try {
            // Update or create depending on the presence of the initial case ID.
            if (this.props.initialCase?._id) {
                await axios.put(
                    `/api/cases/${this.props.initialCase?._id}`,
                    newCase,
                );
            } else {
                await axios.post('/api/cases', newCase);
            }
            this.setState({ errorMessage: '' });
        } catch (e) {
            this.setState({ errorMessage: JSON.stringify(e) });
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
        const { classes, initialCase } = this.props;
        return (
            <Formik
                initialValues={initialValuesFromCase(initialCase)}
                validationSchema={NewCaseValidation}
                onSubmit={(values) => this.submitCase(values)}
            >
                {({
                    submitForm,
                    isSubmitting,
                    values,
                    errors,
                    touched,
                }): JSX.Element => (
                    <div className={classes.container}>
                        <nav className={classes.tableOfContents}>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('source')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.sourceUrl?.trim() !== '',
                                    hasError: hasErrors(
                                        ['sourceUrl'],
                                        errors,
                                        touched,
                                    ),
                                })}
                                Source
                            </div>
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
                                            values.age.toString() !== '') ||
                                        (values.minAge !== undefined &&
                                            values.minAge.toString() !== '' &&
                                            values.maxAge !== undefined &&
                                            values.maxAge.toString() !== '') ||
                                        values.ethnicity !== undefined ||
                                        values.nationalities?.length > 0 ||
                                        values.profession !== undefined,
                                    hasError: hasErrors(
                                        [
                                            'sex',
                                            'minAge',
                                            'maxAge',
                                            'age',
                                            'ethnicity',
                                            'nationalities',
                                            'profession',
                                        ],
                                        errors,
                                        touched,
                                    ),
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
                                    hasError: hasErrors(
                                        ['location'],
                                        errors,
                                        touched,
                                    ),
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
                                    hasError: hasErrors(
                                        [
                                            'confirmedDate',
                                            'methodOfConfirmation',
                                            'onsetSymptomsDate',
                                            'firstClinicalConsultationDate',
                                            'selfIsolationDate',
                                            'admittedToHospital',
                                            'hospitalAdmissionDate',
                                            'icuAdmissionDate',
                                            'outcomeDate',
                                            'outcome',
                                        ],
                                        errors,
                                        touched,
                                    ),
                                })}
                                Events
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('symptoms')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.symptoms?.length > 0,
                                    hasError: hasErrors(
                                        ['symptoms'],
                                        errors,
                                        touched,
                                    ),
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
                                        values.transmissionRoutes?.length > 0 ||
                                        values.transmissionPlaces?.length > 0 ||
                                        values.transmissionLinkedCaseIds
                                            ?.length > 0,
                                    hasError: hasErrors(
                                        [
                                            'transmissionRoutes',
                                            'transmissionPlaces',
                                            'transmissionLinkedCaseIds',
                                        ],
                                        errors,
                                        touched,
                                    ),
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
                                    isChecked:
                                        values.travelHistory?.length > 0 ||
                                        values.traveledPrior30Days !==
                                            undefined,
                                    hasError: hasErrors(
                                        [
                                            'traveledPrior30Days',
                                            'travelHistory',
                                        ],
                                        errors,
                                        touched,
                                    ),
                                })}
                                Travel History
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void =>
                                    this.scrollTo('genomeSequences')
                                }
                            >
                                {this.tableOfContentsIcon({
                                    isChecked:
                                        values.genomeSequences?.length > 0,
                                    hasError: hasErrors(
                                        ['genomeSequences'],
                                        errors,
                                        touched,
                                    ),
                                })}
                                Genome Sequences
                            </div>
                            <div
                                className={classes.tableOfContentsRow}
                                onClick={(): void => this.scrollTo('notes')}
                            >
                                {this.tableOfContentsIcon({
                                    isChecked: values.notes?.trim() !== '',
                                    hasError: hasErrors(
                                        ['notes'],
                                        errors,
                                        touched,
                                    ),
                                })}
                                Notes
                            </div>
                        </nav>
                        <div className={classes.form}>
                            <Form>
                                <div className={classes.formSection}>
                                    <Source></Source>
                                </div>
                                <div className={classes.formSection}>
                                    <Demographics></Demographics>
                                </div>
                                <div className={classes.formSection}>
                                    <LocationForm></LocationForm>
                                </div>
                                <div className={classes.formSection}>
                                    <Events></Events>
                                </div>
                                <div className={classes.formSection}>
                                    <Symptoms></Symptoms>
                                </div>
                                <div className={classes.formSection}>
                                    <Transmission></Transmission>
                                </div>
                                <div className={classes.formSection}>
                                    <TravelHistory></TravelHistory>
                                </div>
                                <div className={classes.formSection}>
                                    <GenomeSequences></GenomeSequences>
                                </div>
                                <div className={classes.formSection}>
                                    <Notes></Notes>
                                </div>
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
                            </Form>
                            {this.state.errorMessage && (
                                <MuiAlert
                                    elevation={6}
                                    variant="filled"
                                    severity="error"
                                >
                                    {this.state.errorMessage}
                                </MuiAlert>
                            )}
                        </div>
                    </div>
                )}
            </Formik>
        );
    }
}

export default withStyles(styles)(NewCaseForm);

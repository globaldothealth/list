import * as Yup from 'yup';

import { Button, LinearProgress } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { GenomeSequence, Travel } from './new-case-form-fields/CaseFormValues';
import { Theme, createStyles } from '@material-ui/core/styles';
import { green, grey, red } from '@material-ui/core/colors';

import AppModal from './AppModal';
import { Case } from './Case';
import CaseFormValues from './new-case-form-fields/CaseFormValues';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@material-ui/icons/Error';
import Events from './new-case-form-fields/Events';
import GenomeSequences from './new-case-form-fields/GenomeSequences';
import LocationForm from './new-case-form-fields/LocationForm';
import MuiAlert from '@material-ui/lab/Alert';
import Notes from './new-case-form-fields/Notes';
import Pathogens from './new-case-form-fields/Pathogens';
import PreexistingConditions from './new-case-form-fields/PreexistingConditions';
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
import { cloneDeep } from 'lodash';
import { hasKey } from './Utils';
import shortId from 'shortid';
import { withStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
    createStyles({
        modalContents: {
            backgroundColor: theme.palette.background.paper,
            left: '300px',
            height: '100%',
            position: 'absolute',
            outline: 'none',
            // Remainder of the screen width accounting for left shift
            width: 'calc(100vw - 300px)',
        },
        appBar: {
            background: 'white',
        },
        tableOfContents: {
            position: 'fixed',
        },
        tableOfContentsRow: {
            alignItems: 'center',
            display: 'flex',
        },
        form: {
            paddingLeft: '18em',
        },
        formSection: {
            margin: '2em 0',
        },
        statusMessage: {
            marginTop: '1em',
            maxWidth: '80%',
        },
        cancelButton: { marginLeft: '1em' },
    });

function initialValuesFromCase(c?: Case): CaseFormValues {
    if (!c) {
        return {
            caseReference: undefined,
            gender: undefined,
            minAge: undefined,
            maxAge: undefined,
            age: undefined,
            ethnicity: undefined,
            nationalities: [],
            occupation: undefined,
            location: undefined,
            confirmedDate: null,
            methodOfConfirmation: undefined,
            onsetSymptomsDate: null,
            firstClinicalConsultationDate: null,
            selfIsolationDate: null,
            admittedToHospital: undefined,
            hospitalAdmissionDate: null,
            admittedToIcu: undefined,
            icuAdmissionDate: null,
            outcomeDate: null,
            outcome: undefined,
            symptomsStatus: undefined,
            symptoms: [],
            hasPreexistingConditions: undefined,
            preexistingConditions: [],
            transmissionRoutes: [],
            transmissionPlaces: [],
            transmissionLinkedCaseIds: [],
            traveledPrior30Days: undefined,
            travelHistory: [],
            genomeSequences: [],
            pathogens: [],
            notes: '',
        };
    }
    return {
        caseReference: c.caseReference,
        gender: c.demographics?.gender,
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
        occupation: c.demographics?.occupation,
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
        admittedToIcu: c.events.find((event) => event.name === 'icuAdmission')
            ?.value,
        icuAdmissionDate:
            c.events.find((event) => event.name === 'icuAdmission')?.dateRange
                ?.start || null,
        outcomeDate:
            c.events.find((event) => event.name === 'outcome')?.dateRange
                ?.start || null,
        outcome: c.events.find((event) => event.name === 'outcome')?.value,
        symptomsStatus: c.symptoms?.status,
        symptoms: c.symptoms?.values,
        hasPreexistingConditions:
            c.preexistingConditions?.hasPreexistingConditions === undefined
                ? undefined
                : c.preexistingConditions?.hasPreexistingConditions
                ? 'Yes'
                : 'No',
        preexistingConditions: c.preexistingConditions?.values ?? [],
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
        pathogens: c.pathogens,
        notes: c.notes,
    };
}

interface Props extends WithStyles<typeof styles> {
    user: User;
    initialCase?: Case;
    onModalClose?: () => void;
}

interface CaseFormState {
    errorMessage: string;
    successMessage: string;
}

const NewCaseValidation = Yup.object().shape(
    {
        caseReference: Yup.object().required('Required'),
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
        confirmedDate: Yup.string().nullable().required('Required'),
        location: Yup.object().required('Required'),
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

class CaseForm extends React.Component<Props, CaseFormState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            errorMessage: '',
            successMessage: '',
        };
    }

    filterTravel(travel: Travel[]): Travel[] {
        const filteredTravel = cloneDeep(travel);
        filteredTravel?.forEach((travel) => {
            delete travel.reactId;
            if (
                travel.dateRange.start === null &&
                travel.dateRange.end === null
            ) {
                delete travel.dateRange;
            } else {
                if (travel.dateRange.start === null) {
                    delete travel.dateRange.start;
                }
                if (travel.dateRange.end === null) {
                    delete travel.dateRange.end;
                }
            }
        });
        return filteredTravel;
    }
    filterGenomeSequences(genomeSequences: GenomeSequence[]): GenomeSequence[] {
        const filteredGenomeSequences = cloneDeep(genomeSequences);
        filteredGenomeSequences?.forEach((genomeSequence) => {
            delete genomeSequence.reactId;
        });
        return filteredGenomeSequences;
    }

    async submitCase(values: CaseFormValues): Promise<void> {
        const ageRange = values.age
            ? { start: values.age, end: values.age }
            : { start: values.minAge, end: values.maxAge };
        const newCase = {
            caseReference: values.caseReference,
            demographics: {
                gender: values.gender,
                ageRange: ageRange,
                ethnicity: values.ethnicity,
                nationalities: values.nationalities,
                occupation: values.occupation,
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
                    value: values.admittedToIcu,
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
                .filter((elem) => elem.dates || elem.value)
                .map((elem) => {
                    return {
                        name: elem.name,
                        dateRange: elem.dates
                            ? {
                                  start: elem.dates,
                                  end: elem.dates,
                              }
                            : undefined,
                        value: elem.value,
                    };
                }),
            symptoms: {
                status: values.symptomsStatus,
                values: values.symptoms,
            },
            preexistingConditions: {
                hasPreexistingConditions:
                    values.hasPreexistingConditions === 'Yes'
                        ? true
                        : values.hasPreexistingConditions === 'No'
                        ? false
                        : undefined,
                values: values.preexistingConditions,
            },
            transmission: {
                routes: values.transmissionRoutes,
                places: values.transmissionPlaces,
                linkedCaseIds: values.transmissionLinkedCaseIds,
            },
            travelHistory: {
                traveledPrior30Days:
                    values.traveledPrior30Days === 'Yes'
                        ? true
                        : values.traveledPrior30Days === 'No'
                        ? false
                        : undefined,
                travel: this.filterTravel(values.travelHistory),
            },
            genomeSequences: this.filterGenomeSequences(values.genomeSequences),
            pathogens: values.pathogens,
            notes: values.notes,
            revisionMetadata: this.props.initialCase
                ? {
                      revisionNumber:
                          this.props.initialCase.revisionMetadata
                              .revisionNumber + 1,
                      creationMetadata: this.props.initialCase.revisionMetadata
                          .creationMetadata,
                      updateMetadata: {
                          curator: this.props.user.email,
                          date: new Date().toISOString(),
                      },
                  }
                : {
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
                this.setState({ successMessage: 'Case edited' });
            } else {
                await axios.post('/api/cases', newCase);
                this.setState({ successMessage: 'Case added' });
            }
            this.setState({ errorMessage: '' });
        } catch (e) {
            this.setState({
                successMessage: '',
                errorMessage: JSON.stringify(e),
            });
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
            containerId: 'scroll-container',
        });
    }

    render(): JSX.Element {
        const { classes, initialCase } = this.props;
        return (
            <AppModal
                title={
                    this.props.initialCase
                        ? 'Edit case'
                        : 'Create new COVID-19 line list case'
                }
                onModalClose={this.props.onModalClose}
            >
                <Formik
                    initialValues={initialValuesFromCase(initialCase)}
                    validationSchema={NewCaseValidation}
                    // Validating on change slows down the form too much. It will
                    // validate on blur and form submission.
                    validateOnChange={false}
                    onSubmit={(values) => this.submitCase(values)}
                >
                    {({
                        submitForm,
                        isSubmitting,
                        values,
                        errors,
                        touched,
                    }): JSX.Element => (
                        <div>
                            <nav className={classes.tableOfContents}>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('source')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked:
                                            values.caseReference !== null &&
                                            values.caseReference !== undefined,
                                        hasError: hasErrors(
                                            ['caseReference'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Source'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('demographics')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked:
                                            values.gender !== undefined ||
                                            (values.age !== undefined &&
                                                values.age.toString() !== '') ||
                                            (values.minAge !== undefined &&
                                                values.minAge.toString() !==
                                                    '' &&
                                                values.maxAge !== undefined &&
                                                values.maxAge.toString() !==
                                                    '') ||
                                            values.ethnicity !== undefined ||
                                            values.nationalities?.length > 0 ||
                                            values.occupation !== undefined,
                                        hasError: hasErrors(
                                            [
                                                'gender',
                                                'minAge',
                                                'maxAge',
                                                'age',
                                                'ethnicity',
                                                'nationalities',
                                                'occupation',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Demographics'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('location')
                                    }
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
                                    {'Location'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('events')
                                    }
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
                                            values.hospitalAdmissionDate !==
                                                null ||
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
                                    {'Events'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('symptoms')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked:
                                            values.symptomsStatus !==
                                                undefined ||
                                            values.symptoms?.length > 0,
                                        hasError: hasErrors(
                                            ['symptomsStatus', 'symptoms'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Symptoms'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('preexistingConditions')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked:
                                            values.hasPreexistingConditions !==
                                                undefined ||
                                            values.preexistingConditions
                                                ?.length > 0,
                                        hasError: hasErrors(
                                            [
                                                'hasPreexistingConditions',
                                                'preexistingConditions',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Preexisting conditions'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('transmission')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked:
                                            values.transmissionRoutes?.length >
                                                0 ||
                                            values.transmissionPlaces?.length >
                                                0 ||
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
                                    {'Transmission'.toLocaleUpperCase()}
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
                                    {'Travel History'.toLocaleUpperCase()}
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
                                    {'Genome Sequences'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        this.scrollTo('pathogens')
                                    }
                                >
                                    {this.tableOfContentsIcon({
                                        isChecked: values.pathogens?.length > 0,
                                        hasError: hasErrors(
                                            ['pathogens'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Pathogens'.toLocaleUpperCase()}
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
                                    {'Notes'.toLocaleUpperCase()}
                                </div>
                            </nav>
                            <div className={classes.form}>
                                <Form>
                                    <div className={classes.formSection}>
                                        <Source
                                            initialValue={values.caseReference}
                                        ></Source>
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
                                        <PreexistingConditions></PreexistingConditions>
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
                                        <Pathogens></Pathogens>
                                    </div>
                                    <div className={classes.formSection}>
                                        <Notes></Notes>
                                    </div>
                                    {isSubmitting && <LinearProgress />}
                                    <br />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disableElevation
                                        data-testid="submit"
                                        disabled={isSubmitting}
                                        onClick={submitForm}
                                    >
                                        {this.props.initialCase
                                            ? 'Edit case'
                                            : 'Submit case'}
                                    </Button>
                                    <Button
                                        className={classes.cancelButton}
                                        color="primary"
                                        variant="outlined"
                                        onClick={this.props.onModalClose}
                                    >
                                        Cancel
                                    </Button>
                                </Form>
                                {this.state.successMessage && (
                                    <MuiAlert
                                        className={classes.statusMessage}
                                        elevation={6}
                                        variant="filled"
                                    >
                                        {this.state.successMessage}
                                    </MuiAlert>
                                )}
                                {this.state.errorMessage && (
                                    <MuiAlert
                                        className={classes.statusMessage}
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
            </AppModal>
        );
    }
}

export default withStyles(styles)(CaseForm);

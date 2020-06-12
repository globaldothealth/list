import { green, grey } from '@material-ui/core/colors';
import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { Select, TextField } from 'formik-material-ui';
import { withStyles } from '@material-ui/core';
import { Theme, createStyles } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/core/styles/withStyles';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import axios from 'axios';

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
    confirmedDate: string;
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
                    id: 0,
                    moderator: this.props.user.email,
                    date: new Date().toISOString(),
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

    tableOfContentsIcon(isChecked: boolean): JSX.Element {
        return isChecked ? (
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

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <Formik
                initialValues={{
                    sex: undefined,
                    country: '',
                    confirmedDate: '',
                    sourceUrl: '',
                    notes: '',
                }}
                onSubmit={(values, errors) => this.submitCase(values)}
            >
                {({ submitForm, isSubmitting, values }): JSX.Element => (
                    <div className={classes.container}>
                        <nav className={classes.tableOfContents}>
                            <div className={classes.tableOfContentsRow}>
                                {this.tableOfContentsIcon(
                                    values.sex !== undefined,
                                )}
                                Demographics
                            </div>
                            <div className={classes.tableOfContentsRow}>
                                {this.tableOfContentsIcon(
                                    values.country.trim() !== '',
                                )}
                                Location
                            </div>
                            <div className={classes.tableOfContentsRow}>
                                {this.tableOfContentsIcon(
                                    values.confirmedDate !== '',
                                )}
                                Events
                            </div>
                            <div className={classes.tableOfContentsRow}>
                                {this.tableOfContentsIcon(
                                    values.sourceUrl.trim() !== '',
                                )}
                                Source
                            </div>
                            <div className={classes.tableOfContentsRow}>
                                {this.tableOfContentsIcon(
                                    values.notes.trim() !== '',
                                )}
                                Notes
                            </div>
                        </nav>
                        <div className={classes.form}>
                            <Form>
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
                                <fieldset>
                                    <legend>Location</legend>
                                    <Field
                                        label="Country"
                                        name="country"
                                        type="text"
                                        component={TextField}
                                    />
                                </fieldset>
                                <fieldset>
                                    <legend>Events</legend>
                                    <InputLabel htmlFor="confirmedDate">
                                        Date confirmed
                                    </InputLabel>
                                    <Field name="confirmedDate" type="date" />
                                </fieldset>
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
                                <fieldset>
                                    <legend>Notes</legend>
                                    <Field
                                        label="Notes"
                                        name="notes"
                                        type="text"
                                        component={TextField}
                                    />
                                </fieldset>
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

import { Button, LinearProgress } from '@material-ui/core';
import { Field, Form, Formik } from 'formik';
import { Select, TextField } from 'formik-material-ui';
import { withStyles } from '@material-ui/core';
import { Theme, createStyles } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/core/styles/withStyles';

import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
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
                    revisionNumber: 0,
                    creationMetadata: {
                        curator: this.props.user.email,
                        date: new Date().toISOString(),
                    }
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

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div className={classes.container}>
                <nav className={classes.tableOfContents}>
                    <div>Demographics</div>
                    <div>Location</div>
                    <div>Events</div>
                    <div>Source</div>
                    <div>Notes</div>
                </nav>
                <div className={classes.form}>
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
                        {({ submitForm, isSubmitting }) => (
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
                        )}
                    </Formik>
                </div>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(NewCaseForm);

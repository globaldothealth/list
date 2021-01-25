import React from 'react';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-material-ui';
import { FormHelperText, LinearProgress, Button } from '@material-ui/core';

interface Props {
    handleSubmit: (code: string) => void;
    setWrongCodeMessage: (value: boolean) => void;
    wrongCodeMessage: boolean;
    isSubmitting: boolean;
    classes: { emailField: any; loader: any; signInButton: any };
}

interface FormProps {
    code: string;
}

export default function VerificationCodeForm({
    handleSubmit,
    setWrongCodeMessage,
    wrongCodeMessage,
    isSubmitting,
    classes,
}: Props) {
    return (
        <Formik
            initialValues={{ code: '' }}
            validate={(values) => {
                const errors: Partial<FormProps> = {};

                if (wrongCodeMessage) {
                    setWrongCodeMessage(false);
                }

                if (!values.code) {
                    errors.code = 'Required';
                }

                return errors;
            }}
            onSubmit={(values) => handleSubmit(values.code)}
        >
            {({ submitForm }) => (
                <Form>
                    <Field
                        className={classes.emailField}
                        variant="outlined"
                        fullWidth={true}
                        component={TextField}
                        disabled={isSubmitting}
                        name="code"
                        type="text"
                        label="Verification code"
                    />
                    {wrongCodeMessage && (
                        <FormHelperText error>
                            Wrong verification code entered
                        </FormHelperText>
                    )}
                    {isSubmitting && (
                        <LinearProgress
                            className={classes.loader}
                            data-testid="loader"
                        />
                    )}
                    <Button
                        className={classes.signInButton}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        onClick={submitForm}
                    >
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
}

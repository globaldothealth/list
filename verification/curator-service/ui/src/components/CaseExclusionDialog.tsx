import React from 'react';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    TextField,
} from '@material-ui/core';
import { Form, Formik, FormikProps, FormikValues } from 'formik';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (note: string) => void;
}

export default function CaseExclusionDialog({
    isOpen,
    onClose,
    onSubmit,
}: Props): JSX.Element {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const handleSubmit = (values: { note: string }): void => {
        setIsLoading(true);
        onSubmit(values.note);
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            // Stops the click being propagated to the table which
            // would trigger the onRowClick action.
            onClick={(e): void => e.stopPropagation()}
        >
            <Formik initialValues={{ note: '' }} onSubmit={handleSubmit}>
                {({
                    values,
                    touched,
                    handleChange,
                }: FormikProps<FormikValues>): JSX.Element => (
                    <Form>
                        <DialogTitle>
                            Case will be ignored during automated ingestion
                            process.
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                {isLoading ? (
                                    <Grid container justify="center">
                                        <Grid item>
                                            <CircularProgress />
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <TextField
                                        name="note"
                                        placeholder="Please specify a reason of the exclusion"
                                        multiline
                                        fullWidth
                                        value={values.note}
                                        onChange={handleChange}
                                        error={touched.note && !values.note}
                                    />
                                )}
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={onClose} color="primary" autoFocus>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                disabled={!values.note || isLoading}
                            >
                                Exclude
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}

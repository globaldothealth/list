import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from '@material-ui/core';
import { Form, Formik, FormikProps, FormikValues } from 'formik';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: { note: string }) => void;
    caseIds: string[];
}

export const CaseExcludeDialog = ({
    isOpen,
    onClose,
    onSubmit,
    caseIds,
}: Props): JSX.Element => (
    <Dialog
        open={isOpen}
        onClose={onClose}
        // Stops the click being propagated to the table which
        // would trigger the onRowClick action.
        onClick={(e): void => e.stopPropagation()}
    >
        <Formik initialValues={{ note: '' }} onSubmit={onSubmit}>
            {({
                values,
                touched,
                handleChange,
            }: FormikProps<FormikValues>): JSX.Element => (
                <Form>
                    <DialogTitle>
                        Are you sure you want to exclude selected cases?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            The following cases will be ignored in the ingestion
                            process:
                            <ul>
                                {caseIds.map((id) => (
                                    <li key={id}>{id}</li>
                                ))}
                            </ul>
                            <TextField
                                name="note"
                                placeholder="Please specify a reason of the exclusion"
                                multiline
                                fullWidth
                                value={values.note}
                                onChange={handleChange}
                                error={touched.note && !values.note}
                            />
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} color="primary" autoFocus>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            disabled={!values.note}
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Form>
            )}
        </Formik>
    </Dialog>
);

export default CaseExcludeDialog;

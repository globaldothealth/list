import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';
import { SnackbarAlert } from '../SnackbarAlert/index';

interface FeedbackEmailDialogProps {
    isOpen: boolean;
    closeFeedbackModal: () => void;
}

export interface FeedbackFormValues {
    subject: string;
    message: string;
}

const FeedbackEmailDialog = ({
    isOpen,
    closeFeedbackModal,
}: FeedbackEmailDialogProps): JSX.Element => {
    const user = useAppSelector(selectUser);

    const maxSizeMessage = 800;

    const [errorOpen, setErrorOpen] = useState(false);

    const validationFormSchema = Yup.object().shape({
        message: Yup.string()
            .max(maxSizeMessage, 'Message is too long.')
            .required('Please, write a message.'),
    });

    const formik = useFormik({
        initialValues: {
            message: '',
        },
        validationSchema: validationFormSchema,
        validateOnChange: true,
        onSubmit: async (values) => {
            try {
                await axios.post('/feedback', {
                    message: `From: ${user?.email}<br><br>${values.message}`,
                });
            } catch (error) {
                setErrorOpen(true);
                throw error;
            }

            closeFeedbackModal();
        },
    });

    // -------------------
    // isOpen = true;
    // -------------------
    return (
        <Dialog
            open={isOpen}
            onClose={closeFeedbackModal}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogContent>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContentText>
                        <TextField
                            rows={5}
                            multiline
                            margin="dense"
                            id="message"
                            name="message"
                            label="Message"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={formik.values.message || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.message &&
                                Boolean(formik.errors.message)
                            }
                            helperText={
                                formik.touched.message && formik.errors.message
                            }
                        />
                    </DialogContentText>
                    <DialogActions>
                        <Button onClick={closeFeedbackModal}>Cancel</Button>
                        <Button type="submit">Send</Button>
                    </DialogActions>
                </form>
            </DialogContent>
            <SnackbarAlert
                isOpen={errorOpen}
                onClose={() => setErrorOpen(false)}
                message={
                    'Unfortunately, an error occurred. Please, try again later.'
                }
                type={'error'}
                durationMs={4000}
            />
        </Dialog>
    );
};

export default FeedbackEmailDialog;

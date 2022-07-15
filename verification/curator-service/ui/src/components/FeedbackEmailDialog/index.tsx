import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useStyles } from './styled';
import axios from 'axios';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../redux/auth/selectors';

interface FeedbackEmailDialogProps {
    isOpen: boolean;
    handleClose: () => void;
}

export interface FeedbackFormValues {
    subject: string;
    message: string;
}

const FeedbackEmailDialog = ({
    isOpen,
    handleClose,
}: FeedbackEmailDialogProps): JSX.Element => {
    const classes = useStyles();
    const user = useAppSelector(selectUser);

    const maxSizeSubject = 100;
    const maxSizeMessage = 800;

    const validationFormSchema = Yup.object().shape({
        subject: Yup.string()
            .max(maxSizeSubject, 'Subject is too long.')
            .required('Please, write a subject.'),
        message: Yup.string()
            .max(maxSizeMessage, 'Message is too long.')
            .required('Please, write a message.'),
    });

    const formik = useFormik({
        initialValues: {
            subject: '',
            message: '',
        },
        validationSchema: validationFormSchema,
        validateOnChange: true,
        onSubmit: async (values) => {
            const { subject, message } = values;
            try {
                const response = await axios.post('/feedback', {
                    subject,
                    message,
                    feedbackUserAdress: user?.email,
                });
            } catch (error) {
                console.error(error);
                throw error;
            }

            handleClose();
        },
    });
    // -------------------
    // isOpen = true;
    // -------------------
    return (
        <div>
            <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>Send Feedback</DialogTitle>
                <DialogContent>
                    <form onSubmit={formik.handleSubmit}>
                        <TextField
                            margin="dense"
                            id="subject"
                            name="subject"
                            label="Subject"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={formik.values.subject || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.subject &&
                                Boolean(formik.errors.subject)
                            }
                            helperText={
                                formik.touched.subject && formik.errors.subject
                            }
                        />
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
                                    formik.touched.message &&
                                    formik.errors.message
                                }
                            />
                        </DialogContentText>

                        <DialogActions>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button type="submit">Send</Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FeedbackEmailDialog;

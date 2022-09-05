import React, { useEffect, useState } from 'react';
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

interface AlertInformationValues {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | '';
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

    const [alertInformation, setAlertInformation] =
        useState<AlertInformationValues>({
            isOpen: false,
            message: '',
            type: '',
        });

    useEffect(() => {
        return () => {
            formik.setErrors({});
        };
        // eslint-disable-next-line
    }, [isOpen]);

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
                await axios
                    .post('/feedback', {
                        message: `From: ${user?.email}<br><br>${values.message}`,
                    })
                    .then((response) => {
                        setAlertInformation({
                            isOpen: true,
                            message: response.data.message,
                            type: 'success',
                        });
                    });
            } catch (error) {
                setAlertInformation({
                    isOpen: true,
                    message:
                        error.response.data.message ||
                        'Unfortunately, an error occurred. Please, try again later.',
                    type: 'error',
                });

                throw error;
            }

            closeFeedbackModal();
        },
    });

    return (
        <>
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
                                    formik.touched.message &&
                                    formik.errors.message
                                }
                            />
                        </DialogContentText>
                        <DialogActions>
                            <Button onClick={closeFeedbackModal}>Cancel</Button>
                            <Button type="submit">Send</Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
            <SnackbarAlert
                isOpen={alertInformation.isOpen}
                onClose={() =>
                    setAlertInformation({ ...alertInformation, isOpen: false })
                }
                message={alertInformation.message}
                type={alertInformation.type || 'info'}
                durationMs={4000}
            />
        </>
    );
};

export default FeedbackEmailDialog;

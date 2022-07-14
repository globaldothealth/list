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

interface FeedbackEmailDialogProps {
    isOpen: boolean;
    handleClose: () => void;
}

export interface FeedbackFormValues {
    topic: string;
    message: string;
}

const FeedbackEmailDialog = ({
    isOpen,
    handleClose,
}: FeedbackEmailDialogProps): JSX.Element => {
    const classes = useStyles();

    const maxSizeTopic = 100;
    const maxSizeMessage = 800;

    const validationFormSchema = Yup.object().shape({
        topic: Yup.string()
            .max(maxSizeTopic, 'Topic is too long.')
            .required('Please, write a topic.'),
        message: Yup.string()
            .max(maxSizeMessage, 'Message is too long.')
            .required('Please, write a message.'),
    });

    const formik = useFormik({
        initialValues: {
            topic: '',
            message: '',
        },
        validationSchema: validationFormSchema,
        validateOnChange: true,
        onSubmit: (values) => {
            console.log('test');
            console.log(values);
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
                            id="topic"
                            name="topic"
                            label="Topic"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={formik.values.topic || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.topic &&
                                Boolean(formik.errors.topic)
                            }
                            helperText={
                                formik.touched.topic && formik.errors.topic
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

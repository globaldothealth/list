import { useAppDispatch } from '../../hooks/redux';
import { changeCasesStatus } from '../../redux/linelistTable/thunk';
import { VerificationStatus } from '../../api/models/Case';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useFormik } from 'formik';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    caseIds: string[];
}

export const CaseExcludeDialog = ({
    isOpen,
    onClose,
    caseIds,
}: Props): JSX.Element => {
    const dispatch = useAppDispatch();

    const formik = useFormik({
        initialValues: {
            note: '',
        },
        onSubmit: (values) => {
            const { note } = values;
            if (!note) return;

            dispatch(
                changeCasesStatus({
                    status: VerificationStatus.Excluded,
                    caseIds,
                    note,
                }),
            );
        },
    });

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            // Stops the click being propagated to the table which
            // would trigger the onRowClick action.
            onClick={(e): void => e.stopPropagation()}
        >
            <form onSubmit={formik.handleSubmit}>
                <DialogTitle>
                    Are you sure you want to exclude selected cases?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The following cases will be ignored in the ingestion
                        process:
                    </DialogContentText>
                    <ul>
                        {caseIds.map((id) => (
                            <li key={id}>{id}</li>
                        ))}
                    </ul>
                    <TextField
                        name="note"
                        variant="standard"
                        placeholder="Please specify reason for exclusion"
                        multiline
                        fullWidth
                        value={formik.values.note}
                        onChange={formik.handleChange}
                        error={formik.touched.note && !formik.values.note}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary" autoFocus>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        disabled={!formik.values.note}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CaseExcludeDialog;

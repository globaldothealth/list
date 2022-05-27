import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectVerificationStatus } from '../../redux/linelistTable/selectors';
import { changeCasesStatus } from '../../redux/linelistTable/thunk';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    caseIds: string[] | undefined;
    query: string | undefined;
}

export const CaseIncludeDialog = ({
    isOpen,
    onClose,
    caseIds,
    query,
}: Props): JSX.Element => {
    const dispatch = useAppDispatch();

    const verificationStatus = useAppSelector(selectVerificationStatus);

    const handleSubmit = () => {
        if (!verificationStatus) return;

        onClose();

        dispatch(
            changeCasesStatus({
                status: verificationStatus,
                caseIds,
                query,
            }),
        );
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            // Stops the click being propagated to the table which
            // would trigger the onRowClick action.
            onClick={(e): void => e.stopPropagation()}
        >
            <DialogTitle>
                Are you sure you want to reinclude selected cases?
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {query
                        ? 'All the cases matching current search query will be reincluded in the ingestion process'
                        : 'The following cases will be reincluded in the ingestion process:'}

                    {caseIds && (
                        <ul>
                            {caseIds.map((id) => (
                                <li key={id}>{id}</li>
                            ))}
                        </ul>
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" autoFocus>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color="primary">
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

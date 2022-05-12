import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectIsLoading } from '../../redux/linelistTable/selectors';
import { deleteCases } from '../../redux/linelistTable/thunk';

import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

interface CaseDeleteDialogProps {
    isOpen: boolean;
    handleClose: () => void;
    caseIds: string[];
}

export const CaseDeleteDialog = ({
    isOpen,
    handleClose,
    caseIds,
}: CaseDeleteDialogProps) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isLoading = useAppSelector(selectIsLoading);

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            // Stops the click being propagated to the table which
            // would trigger the onRowClick action.
            onClick={(e): void => e.stopPropagation()}
        >
            <DialogTitle>
                Are you sure you want to delete{' '}
                {caseIds.length === 1 ? '1 case' : `${caseIds.length} cases`}?
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {caseIds.length === 1
                        ? '1 case'
                        : `${caseIds.length} cases`}{' '}
                    will be permanently deleted.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {isLoading ? (
                    <CircularProgress
                        sx={{ marginRight: theme.spacing(2), padding: '6px' }}
                    />
                ) : (
                    <>
                        <Button onClick={handleClose} color="primary" autoFocus>
                            Cancel
                        </Button>

                        <Button
                            onClick={() => dispatch(deleteCases(caseIds))}
                            color="primary"
                        >
                            Yes
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

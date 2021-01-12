import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@material-ui/core';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    caseIds: string[];
}

export const CaseIncludeDialog = ({
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
        <DialogTitle>
            Are you sure you want to reinclude selected cases?
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                The following cases will be reincluded in the ingestion process:
                <ul>
                    {caseIds.map((id) => (
                        <li key={id}>{id}</li>
                    ))}
                </ul>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} color="primary" autoFocus>
                Cancel
            </Button>
            <Button onClick={onSubmit} color="primary">
                Yes
            </Button>
        </DialogActions>
    </Dialog>
);

export default CaseIncludeDialog;

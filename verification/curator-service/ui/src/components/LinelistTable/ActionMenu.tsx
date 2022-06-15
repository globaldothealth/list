import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoNotDisturbOutlinedIcon from '@mui/icons-material/DoNotDisturbOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CaseDeleteDialog } from '../Dialogs/CaseDeleteDialog';
import { CaseExcludeDialog } from '../Dialogs/CaseExcludeDialog';

import { ActionMenuItem } from './styled';

interface ActionMenuProps {
    caseId: string;
}

enum Actions {
    Edit,
    Delete,
    Exclude,
}

export const ActionMenu = ({ caseId }: ActionMenuProps) => {
    const history = useHistory();
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [excludeDialogOpen, setExcludeDialogOpen] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    // eslint-disable-next-line
    const handleClose = (event?: any) => {
        if (event) {
            event.stopPropagation();
        }
        setAnchorEl(null);
    };

    const handleActionClick = (
        event: React.MouseEvent<HTMLElement>,
        action: Actions,
    ) => {
        event.stopPropagation();
        handleClose();

        switch (action) {
            case Actions.Edit:
                history.push(`/cases/edit/${caseId}`, {
                    lastLocation: location.pathname,
                });
                break;

            case Actions.Delete:
                setDeleteDialogOpen(true);
                break;

            case Actions.Exclude:
                setExcludeDialogOpen(true);
                break;
        }
    };

    return (
        <div>
            <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
            </IconButton>
            <Menu
                id="demo-customized-menu"
                MenuListProps={{
                    'aria-labelledby': 'demo-customized-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={(event) => handleClose(event)}
            >
                <ActionMenuItem
                    onClick={(event) => handleActionClick(event, Actions.Edit)}
                    disableRipple
                >
                    <EditOutlinedIcon sx={{ marginRight: '0.5rem' }} />
                    Edit
                </ActionMenuItem>

                <ActionMenuItem
                    onClick={(event) =>
                        handleActionClick(event, Actions.Delete)
                    }
                    disableRipple
                >
                    <DeleteOutlineIcon sx={{ marginRight: '0.5rem' }} />
                    Delete
                </ActionMenuItem>

                <ActionMenuItem
                    onClick={(event) =>
                        handleActionClick(event, Actions.Exclude)
                    }
                    disableRipple
                >
                    <DoNotDisturbOutlinedIcon sx={{ marginRight: '0.5rem' }} />
                    Exclude
                </ActionMenuItem>
            </Menu>

            <CaseExcludeDialog
                isOpen={excludeDialogOpen}
                onClose={() => setExcludeDialogOpen(false)}
                caseIds={[caseId]}
                query={undefined}
            />

            <CaseDeleteDialog
                isOpen={deleteDialogOpen}
                handleClose={() => setDeleteDialogOpen(false)}
                caseIds={[caseId]}
                query={undefined}
            />
        </div>
    );
};

import { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    setExcludeCasesDialogOpen,
    setDeleteCasesDialogOpen,
} from '../../redux/linelistTable/slice';
import {
    changeCasesStatus,
    downloadCases,
} from '../../redux/linelistTable/thunk';
import { selectCasesSelected } from '../../redux/linelistTable/selectors';
import { VerificationStatus } from '../../api/models/Case';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Stack from '@mui/material/Stack';

import ExcludeIcon from '../assets/excluded_icon.svg';
import UnverifiedIcon from '../assets/unverified_icon.svg';
import VerifiedIcon from '../assets/verified_icon.svg';

import Header from './Header';

interface EnhancedTableToolbarProps {
    numSelected: number;
}

const EnhancedTableToolbar = ({ numSelected }: EnhancedTableToolbarProps) => {
    const dispatch = useAppDispatch();

    const selectedCases = useAppSelector(selectCasesSelected);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <Toolbar
            sx={{
                pl: { sm: numSelected > 0 ? 2 : 0 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                    bgcolor: (theme) =>
                        theme.custom.palette.appBar.backgroundColor,
                }),
            }}
        >
            {numSelected > 0 ? (
                <>
                    <Typography color="white" variant="h6" component="div">
                        {numSelected} row{numSelected > 1 ? 's' : ''} selected
                    </Typography>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ marginLeft: '2rem' }}
                    >
                        <Tooltip title="Verify selected rows">
                            <IconButton
                                onClick={() =>
                                    dispatch(
                                        changeCasesStatus({
                                            status: VerificationStatus.Verified,
                                            caseIds: selectedCases,
                                        }),
                                    )
                                }
                            >
                                <img
                                    src={VerifiedIcon}
                                    alt="Verify cases button"
                                    data-testid="verify-action"
                                />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Unverify selected rows">
                            <IconButton
                                onClick={() =>
                                    dispatch(
                                        changeCasesStatus({
                                            status: VerificationStatus.Unverified,
                                            caseIds: selectedCases,
                                        }),
                                    )
                                }
                            >
                                <img
                                    src={UnverifiedIcon}
                                    alt="Unverify cases button"
                                    data-testid="unverify-action"
                                />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Exclude selected rows">
                            <IconButton
                                onClick={() =>
                                    dispatch(setExcludeCasesDialogOpen(true))
                                }
                            >
                                <img
                                    src={ExcludeIcon}
                                    alt="Exclude cases button"
                                    data-testid="exclude-action"
                                />
                            </IconButton>
                        </Tooltip>

                        <Tooltip
                            title="Download selected rows"
                            aria-label="download selected rows"
                        >
                            <>
                                <form
                                    hidden
                                    ref={formRef}
                                    method="POST"
                                    action="/api/cases/download"
                                >
                                    {selectedCases.map((caseId) => (
                                        <input
                                            readOnly
                                            name="caseIds[]"
                                            key={caseId}
                                            value={caseId}
                                        />
                                    ))}
                                </form>
                                <IconButton
                                    sx={{ color: 'white' }}
                                    onClick={() => {
                                        if (!formRef.current) return;

                                        formRef.current.submit();
                                    }}
                                >
                                    <FileDownloadOutlinedIcon />
                                </IconButton>
                            </>
                        </Tooltip>

                        <Tooltip title="Delete selected rows">
                            <IconButton
                                sx={{ color: 'white' }}
                                onClick={() =>
                                    dispatch(setDeleteCasesDialogOpen(true))
                                }
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </>
            ) : (
                <Header />
            )}
        </Toolbar>
    );
};

export default EnhancedTableToolbar;

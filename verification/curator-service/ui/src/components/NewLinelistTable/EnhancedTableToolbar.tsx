import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
    setExcludeCasesDialogOpen,
    setDeleteCasesDialogOpen,
    setReincludeCasesDialogOpen,
    setVerificationStatus,
    setRowsAcrossPagesSelected,
    setCasesSelected,
} from '../../redux/linelistTable/slice';
import { changeCasesStatus } from '../../redux/linelistTable/thunk';
import {
    selectCasesSelected,
    selectCases,
    selectSearchQuery,
    selectTotalCases,
    selectRowsAcrossPages,
} from '../../redux/linelistTable/selectors';
import { VerificationStatus } from '../../api/models/Case';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Stack from '@mui/material/Stack';

import ExcludeIcon from '../assets/excluded_icon.svg';
import UnverifiedIcon from '../assets/unverified_icon.svg';
import VerifiedIcon from '../assets/verified_icon.svg';

import Header from './Header';

enum Actions {
    Verify,
    Unverify,
}

const EnhancedTableToolbar = () => {
    const dispatch = useAppDispatch();

    const selectedCases = useAppSelector(selectCasesSelected);
    const cases = useAppSelector(selectCases);
    const searchQuery = useAppSelector(selectSearchQuery);
    const totalCases = useAppSelector(selectTotalCases);
    const rowsAcrossPagesSelected = useAppSelector(selectRowsAcrossPages);
    const formRef = useRef<HTMLFormElement>(null);

    const [numSelectedCases, setNumSelectedCases] = useState(
        selectedCases.length,
    );

    useEffect(() => {
        setNumSelectedCases(selectedCases.length);
    }, [selectedCases]);

    const handleActionClick = (action: Actions) => {
        // Check if any of the selected cases is excluded
        const excludedCases: string[] = [];
        cases.forEach((caseObj) => {
            if (
                selectedCases.includes(caseObj._id) &&
                caseObj.caseReference.verificationStatus ===
                    VerificationStatus.Excluded
            ) {
                excludedCases.push(caseObj._id);
            }
        });

        let verificationStatus: VerificationStatus;

        switch (action) {
            case Actions.Verify:
                verificationStatus = VerificationStatus.Verified;
                break;

            case Actions.Unverify:
                verificationStatus = VerificationStatus.Unverified;
                break;
        }

        if (excludedCases.length !== 0) {
            dispatch(setReincludeCasesDialogOpen(true));
            dispatch(setVerificationStatus(verificationStatus));
        } else {
            dispatch(
                changeCasesStatus({
                    status: verificationStatus,
                    caseIds: rowsAcrossPagesSelected
                        ? undefined
                        : selectedCases,
                    query: rowsAcrossPagesSelected
                        ? decodeURIComponent(searchQuery)
                        : undefined,
                }),
            );
        }
    };

    const handleSelectAllRowsAcrossPagesClick = () => {
        if (rowsAcrossPagesSelected || numSelectedCases === totalCases) {
            dispatch(setRowsAcrossPagesSelected(false));
            dispatch(setCasesSelected([]));
            setNumSelectedCases(0);
        } else {
            dispatch(setRowsAcrossPagesSelected(cases.length < totalCases));
            dispatch(setCasesSelected(cases.map((caseObj) => caseObj._id)));
            setNumSelectedCases(totalCases);
        }
    };

    return (
        <Toolbar
            sx={{
                pl: { sm: numSelectedCases > 0 ? 2 : 0 },
                pr: { xs: 1, sm: 1 },
                ...(numSelectedCases > 0 && {
                    bgcolor: (theme) =>
                        theme.custom.palette.appBar.backgroundColor,
                }),
            }}
        >
            {numSelectedCases > 0 ? (
                <>
                    <Stack direction="row" spacing={2}>
                        <Typography color="white" variant="h6" component="div">
                            {rowsAcrossPagesSelected
                                ? totalCases
                                : numSelectedCases}{' '}
                            row
                            {numSelectedCases > 1 ? 's' : ''} selected
                        </Typography>

                        {searchQuery && searchQuery !== '' && (
                            <Button
                                variant="text"
                                sx={{ color: '#ffffff' }}
                                onClick={handleSelectAllRowsAcrossPagesClick}
                            >
                                {rowsAcrossPagesSelected ||
                                numSelectedCases === totalCases
                                    ? 'Unselect'
                                    : 'Select'}{' '}
                                all {totalCases} rows
                            </Button>
                        )}
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ marginLeft: '1rem' }}
                    >
                        <Tooltip title="Verify selected rows">
                            <IconButton
                                onClick={() =>
                                    handleActionClick(Actions.Verify)
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
                                    handleActionClick(Actions.Unverify)
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

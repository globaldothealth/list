import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchLinelistData, changeCasesStatus, deleteCases } from './thunk';
import { Case, VerificationStatus } from '../../api/models/Case';
import { SortBy, SortByOrder } from '../../constants/types';

interface LinelistTableState {
    isLoading: boolean;
    cases: Case[];
    currentPage: number;
    nextPage: number;
    rowsPerPage: number;
    sort: {
        value: SortBy;
        order: SortByOrder;
    };
    searchQuery: string;
    total: number;
    error: string | undefined;
    excludeCasesDialogOpen: boolean;
    deleteCasesDialogOpen: boolean;
    reincludeCasesDialogOpen: boolean;
    casesSelected: string[];
    refetchData: boolean;
    verificationStatus: VerificationStatus | undefined;
    rowsAcrossPagesSelected: boolean;
}

const initialState: LinelistTableState = {
    isLoading: false,
    cases: [],
    currentPage: 0,
    nextPage: 1,
    rowsPerPage: 50,
    sort: {
        value: SortBy.ConfirmationDate,
        order: SortByOrder.Descending,
    },
    searchQuery: '',
    total: 0,
    error: undefined,
    excludeCasesDialogOpen: false,
    deleteCasesDialogOpen: false,
    reincludeCasesDialogOpen: false,
    casesSelected: [],
    refetchData: false,
    verificationStatus: undefined,
    rowsAcrossPagesSelected: false,
};

const linelistTableSlice = createSlice({
    name: 'linelist',
    initialState,
    reducers: {
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setRowsPerPage: (state, action: PayloadAction<number>) => {
            state.rowsPerPage = action.payload;
        },
        setSort: (
            state,
            action: PayloadAction<{ value: SortBy; order: SortByOrder }>,
        ) => {
            state.sort = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setExcludeCasesDialogOpen: (state, action: PayloadAction<boolean>) => {
            state.excludeCasesDialogOpen = action.payload;
        },
        setCasesSelected: (state, action: PayloadAction<string[]>) => {
            state.casesSelected = action.payload;
        },
        setDeleteCasesDialogOpen: (state, action: PayloadAction<boolean>) => {
            state.deleteCasesDialogOpen = action.payload;
        },
        setReincludeCasesDialogOpen: (
            state,
            action: PayloadAction<boolean>,
        ) => {
            state.reincludeCasesDialogOpen = action.payload;
        },
        setVerificationStatus: (
            state,
            action: PayloadAction<VerificationStatus>,
        ) => {
            state.verificationStatus = action.payload;
        },
        setRowsAcrossPagesSelected: (state, action: PayloadAction<boolean>) => {
            state.rowsAcrossPagesSelected = action.payload;
        },
    },
    extraReducers: (builder) => {
        // FETCH CASES
        builder.addCase(fetchLinelistData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchLinelistData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.cases = payload.cases;
            state.nextPage = payload.nextPage;
            state.total = payload.total;
        });
        builder.addCase(fetchLinelistData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });

        // CHANGE STATUS
        builder.addCase(changeCasesStatus.pending, (state) => {
            state.isLoading = true;
            state.excludeCasesDialogOpen = false;
        });
        builder.addCase(changeCasesStatus.fulfilled, (state, { payload }) => {
            const { updatedIds, newStatus } = payload;

            state.isLoading = false;
            state.casesSelected = [];
            state.rowsAcrossPagesSelected = false;
            if (updatedIds) {
                state.cases = state.cases.map((data) =>
                    updatedIds.includes(data._id)
                        ? {
                              ...data,
                              caseReference: {
                                  ...data.caseReference,
                                  verificationStatus: newStatus,
                              },
                          }
                        : data,
                );
            } else {
                // This acts only as a trigger, so it doesn't matter which boolean value it is
                state.refetchData = !state.refetchData;
            }
        });
        builder.addCase(changeCasesStatus.rejected, (state, action) => {
            state.isLoading = false;
            state.excludeCasesDialogOpen = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });

        // DELETE
        builder.addCase(deleteCases.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(deleteCases.fulfilled, (state) => {
            state.isLoading = false;
            state.deleteCasesDialogOpen = false;
            state.casesSelected = [];
            state.rowsAcrossPagesSelected = false;
            // This acts only as a trigger, so it doesn't matter which boolean value it is
            state.refetchData = !state.refetchData;
        });
        builder.addCase(deleteCases.rejected, (state, action) => {
            state.isLoading = false;
            state.deleteCasesDialogOpen = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

// actions
export const {
    setCurrentPage,
    setRowsPerPage,
    setSort,
    setSearchQuery,
    setExcludeCasesDialogOpen,
    setCasesSelected,
    setDeleteCasesDialogOpen,
    setReincludeCasesDialogOpen,
    setVerificationStatus,
    setRowsAcrossPagesSelected,
} = linelistTableSlice.actions;

export default linelistTableSlice.reducer;

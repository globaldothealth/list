import { RootState } from '../store';

export const selectIsLoading = (state: RootState) => state.linelist.isLoading;
export const selectCases = (state: RootState) => state.linelist.cases;
export const selectCurrentPage = (state: RootState) =>
    state.linelist.currentPage;
export const selectNextPage = (state: RootState) => state.linelist.nextPage;
export const selectTotalCases = (state: RootState) => state.linelist.total;
export const selectError = (state: RootState) => state.linelist.error;
export const selectRowsPerPage = (state: RootState) =>
    state.linelist.rowsPerPage;
export const selectSort = (state: RootState) => state.linelist.sort;
export const selectSearchQuery = (state: RootState) =>
    state.linelist.searchQuery;
export const selectExcludeCasesDialogOpen = (state: RootState) =>
    state.linelist.excludeCasesDialogOpen;
export const selectCasesSelected = (state: RootState) =>
    state.linelist.casesSelected;
export const selectDeleteCasesDialogOpen = (state: RootState) =>
    state.linelist.deleteCasesDialogOpen;
export const selectReincludeCasesDialogOpen = (state: RootState) =>
    state.linelist.reincludeCasesDialogOpen;
export const selectRefetchData = (state: RootState) =>
    state.linelist.refetchData;
export const selectVerificationStatus = (state: RootState) =>
    state.linelist.verificationStatus;
export const selectRowsAcrossPages = (state: RootState) =>
    state.linelist.rowsAcrossPagesSelected;

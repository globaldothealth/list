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

import { RootState } from '../store';

export const selectSearchQuery = (state: RootState) => state.app.searchQuery;
export const selectFilterBreadcrumbs = (state: RootState) =>
    state.app.filterBreadcrumbs;
export const selectIsLoading = (state: RootState) => state.app.isLoading;

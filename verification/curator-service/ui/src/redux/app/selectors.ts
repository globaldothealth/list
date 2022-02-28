import { ChipData } from '../../components/App/App';
import { RootState } from '../store';

export const selectSearchQuery: (state: RootState) => string = (state) =>
    state.app.searchQuery;
export const selectFilterBreadcrumbs: (state: RootState) => ChipData[] = (
    state,
) => state.app.filterBreadcrumbs;
export const selectIsLoading: (state: RootState) => boolean = (state) =>
    state.app.isLoading;
export const selectVersion: (state: RootState) => string = (state) =>
    state.app.version;

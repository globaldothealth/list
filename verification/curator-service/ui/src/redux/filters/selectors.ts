import { RootState } from '../store';

export const selectModalOpen = (state: RootState) => state.filters.modalOpen;
export const countryList: (state: RootState) => string[] = (state) =>
    state.filters.countryList;
export const selectActiveFilterInput = (state: RootState) =>
    state.filters.activeFilterInput;
export const isLoading: (state: RootState) => boolean = (state) =>
    state.filters.isLoading;
export const filterError: (state: RootState) => string | undefined = (state) =>
    state.filters.error;

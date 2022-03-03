import { RootState } from '../store';

export const countryList: (state: RootState) => string[] = (state) =>
    state.filters.countryList;
export const isLoading: (state: RootState) => boolean = (state) =>
    state.filters.isLoading;
export const filterError: (state: RootState) => string | undefined = (state) =>
    state.filters.error;

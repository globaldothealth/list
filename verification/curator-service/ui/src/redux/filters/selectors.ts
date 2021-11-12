import { RootState } from '../store';

export const countryList: (state: RootState) => string[] = (state) =>
    state.filtersReducer.countryList;
export const isLoading: (state: RootState) => boolean = (state) =>
    state.filtersReducer.isLoading;
export const filterError: (state: RootState) => string | undefined = (state) =>
    state.filtersReducer.error;

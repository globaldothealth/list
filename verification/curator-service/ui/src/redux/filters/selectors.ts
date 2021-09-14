import { RootState } from '../store';

export const countryList = (state: RootState) => state.filtersReducer.countryList;
export const isLoading = (state: RootState) => state.filtersReducer.isLoading;

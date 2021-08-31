import { RootState } from '../store';

export const countryList = (state: RootState) => state.countryListReducer.countryList;
export const isLoading = (state: RootState) => state.countryListReducer.isLoading;

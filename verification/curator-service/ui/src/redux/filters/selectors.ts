import { RootState } from '../store';

export const countryList = (state: RootState) => state.countryListReducer.countryList;

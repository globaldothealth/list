import { RootState } from '../store';

export const acknowledgmentData = (state: RootState) =>
    state.acknowledgmentDataReducer.acknowledgmentData;
export const isLoading = (state: RootState) =>
    state.acknowledgmentDataReducer.isLoading;
export const acknowledgmentDataError = (state: RootState) =>
    state.acknowledgmentDataReducer.error;

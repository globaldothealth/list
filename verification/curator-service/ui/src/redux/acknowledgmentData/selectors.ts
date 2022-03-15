/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { RootState } from '../store';

export const selectAcknowledgmentData = (state: RootState) =>
    state.acknowledgement.acknowledgmentData;
export const selectIsLoading = (state: RootState) =>
    state.acknowledgement.isLoading;
export const selectError = (state: RootState) => state.acknowledgement.error;

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { RootState } from '../store';

export const selectAcknowledgmentData = (state: RootState) =>
    state.acknowledgment.acknowledgmentData;
export const selectIsLoading = (state: RootState) =>
    state.acknowledgment.isLoading;
export const selectError = (state: RootState) => state.acknowledgment.error;

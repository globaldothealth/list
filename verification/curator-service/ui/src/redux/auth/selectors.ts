import { RootState } from '../store';

export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectUser = (state: RootState) => state.auth.user;
export const selectResetPasswordEmailSent = (state: RootState) =>
    state.auth.resetPasswordEmailSent;
export const selectForgotPasswordPopupOpen = (state: RootState) =>
    state.auth.forgotPasswordPopupOpen;
export const selectPasswordReset = (state: RootState) =>
    state.auth.passwordReset;

export const selectSnackbar = (state: RootState) => state.auth.snackbar;

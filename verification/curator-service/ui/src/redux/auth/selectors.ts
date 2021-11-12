import { SnackbarProps } from '@material-ui/core';
import { User } from '../../api/models/User';
import { RootState } from '../store';

export const selectIsLoading: (state: RootState) => boolean = (state) =>
    state.auth.isLoading;
export const selectError: (state: RootState) => string | undefined = (state) =>
    state.auth.error;
export const selectUser: (state: RootState) => User | undefined = (state) =>
    state.auth.user;
export const selectResetPasswordEmailSent: (state: RootState) => boolean = (
    state,
) => state.auth.resetPasswordEmailSent;
export const selectForgotPasswordPopupOpen: (state: RootState) => boolean = (
    state,
) => state.auth.forgotPasswordPopupOpen;
export const selectPasswordReset: (state: RootState) => boolean = (state) =>
    state.auth.passwordReset;
export const selectChangePasswordResponse: (
    state: RootState,
) => string | undefined = (state) => state.auth.changePasswordResponse;

export const selectSnackbar: (state: RootState) => SnackbarProps = (state) =>
    state.auth.snackbar;

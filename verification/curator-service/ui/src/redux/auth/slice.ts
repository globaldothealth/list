import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../api/models/User';
import {
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    getUserProfile,
    requestResetPasswordLink,
    resetPassword,
    logout,
    changePassword,
} from './thunk';

import { WritableDraft } from 'immer/dist/internal';

interface SnackbarProps {
    isOpen: boolean;
    message: string;
}

interface AuthState {
    isLoading: boolean;
    user: User | undefined;
    error: string | undefined;
    resetPasswordEmailSent: boolean;
    passwordReset: boolean;
    changePasswordResponse: string | undefined;
    forgotPasswordPopupOpen: boolean;
    snackbar: SnackbarProps;
}

const initialState: AuthState = {
    isLoading: false,
    user:
        (localStorage.getItem('user')
            ? (JSON.parse(localStorage.getItem('user')!) as User)
            : undefined) || undefined,
    error: undefined,
    resetPasswordEmailSent: false,
    passwordReset: false,
    changePasswordResponse: undefined,
    forgotPasswordPopupOpen: false,
    snackbar: {
        isOpen: false,
        message: '',
    },
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        resetError: (state) => {
            state.error = undefined;
        },
        setForgotPasswordPopupOpen: (state, action: PayloadAction<boolean>) => {
            state.error = undefined;
            state.forgotPasswordPopupOpen = action.payload;
        },
        toggleSnackbar: (state, action: PayloadAction<SnackbarProps>) => {
            state.snackbar = action.payload;
        },
        setResetPasswordEmailSent: (state, action: PayloadAction<boolean>) => {
            state.resetPasswordEmailSent = action.payload;
        },
        resetChangePasswordResponse: (state) => {
            state.changePasswordResponse = undefined;
        },
    },
    extraReducers: (builder) => {
        // SIGN IN
        builder.addCase(signInWithEmailAndPassword.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(
            signInWithEmailAndPassword.fulfilled,
            (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            },
        );
        builder.addCase(
            signInWithEmailAndPassword.rejected,
            (state, action) => {
                state.isLoading = false;
                state.error = action.payload
                    ? action.payload
                    : action.error.message;
            },
        );

        // SIGN UP
        builder.addCase(signUpWithEmailAndPassword.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(
            signUpWithEmailAndPassword.fulfilled,
            (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            },
        );

        builder.addCase(
            signUpWithEmailAndPassword.rejected,
            (state, action) => {
                state.isLoading = false;
                state.error = action.payload
                    ? action.payload
                    : action.error.message;
            },
        );

        // GET USER PROFILE
        builder.addCase(getUserProfile.fulfilled, (state, action) => {
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        });
        builder.addCase(getUserProfile.rejected, (state) => {
            state.user = undefined;
            localStorage.removeItem('user');
        });

        // REQUEST PASSWORD RESET
        builder.addCase(requestResetPasswordLink.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(requestResetPasswordLink.fulfilled, (state) => {
            state.isLoading = false;
            state.resetPasswordEmailSent = true;
        });
        builder.addCase(requestResetPasswordLink.rejected, (state, action) => {
            state.isLoading = false;
            state.resetPasswordEmailSent = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });

        // RESET PASSWORD
        builder.addCase(resetPassword.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(resetPassword.fulfilled, (state) => {
            state.isLoading = false;
            state.passwordReset = true;
        });
        builder.addCase(resetPassword.rejected, (state, action) => {
            state.isLoading = false;
            state.passwordReset = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });

        // LOGOUT
        builder.addCase(logout.fulfilled, (state) => {
            state.user = undefined;
        });

        // CHANGE PASSWORD
        builder.addCase(changePassword.pending, (state) => {
            state.isLoading = true;
            state.changePasswordResponse = undefined;
            state.error = undefined;
        });
        builder.addCase(changePassword.fulfilled, (state, action) => {
            state.isLoading = false;
            state.changePasswordResponse = action.payload;
        });
        builder.addCase(changePassword.rejected, (state, action) => {
            state.isLoading = false;
            state.changePasswordResponse = undefined;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

// Actions
export const {
    resetError,
    setForgotPasswordPopupOpen,
    toggleSnackbar,
    setResetPasswordEmailSent,
    resetChangePasswordResponse,
} = authSlice.actions;

export default authSlice.reducer;

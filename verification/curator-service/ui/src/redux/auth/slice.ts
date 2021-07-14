import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../api/models/User';
import {
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    getUserProfile,
    requestResetPasswordLink,
    resetPassword,
    logout,
} from './thunk';

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
    forgotPasswordPopupOpen: boolean;
    snackbar: SnackbarProps;
}

const initialState: AuthState = {
    isLoading: false,
    user: undefined,
    error: undefined,
    resetPasswordEmailSent: false,
    passwordReset: false,
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
        });
        builder.addCase(getUserProfile.rejected, (state) => {
            state.user = undefined;
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
        builder.addCase(resetPassword.fulfilled, (state, action) => {
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
    },
});

// Actions
export const { resetError, setForgotPasswordPopupOpen, toggleSnackbar } =
    authSlice.actions;

export default authSlice.reducer;

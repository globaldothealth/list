import { createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../../api/models/User';
import axios from 'axios';
import { sendCustomGtmEvent } from '../../components/util/helperFunctions';

export const signInWithEmailAndPassword = createAsyncThunk<
    User,
    { email: string; password: string },
    { rejectValue: string }
>(
    'auth/signInWithEmailAndPassword',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await axios.post<User>('/auth/signin', {
                email,
                password,
            });

            return response.data;
        } catch (error) {
            if (!error.response) throw error;
            return rejectWithValue(error.response.data.message);
        }
    },
);

export const signUpWithEmailAndPassword = createAsyncThunk<
    User,
    { email: string; password: string; newsletterAccepted: boolean },
    { rejectValue: string }
>('auth/signUpWithEmailAndPassword', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post<User>('/auth/signup', data);

        sendCustomGtmEvent('sign_up', {
            newsletter_accepted: data.newsletterAccepted,
            method: 'email',
        });

        return response.data;
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(error.response.data.message);
    }
});

export const getUserProfile = createAsyncThunk(
    'auth/getUserProfile',
    async () => {
        const response = await axios.get<User>('/auth/profile');
        return response.data;
    },
);

export const requestResetPasswordLink = createAsyncThunk<
    void,
    { email: string },
    { rejectValue: string }
>('auth/requestResetPasswordLink', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/request-password-reset', data);

        if (response.status !== 200) {
            throw new Error('Something went wrong, please try again');
        }

        return;
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(error.response.data.message);
    }
});

export const resetPassword = createAsyncThunk<
    void,
    { token: string; userId: string; newPassword: string },
    { rejectValue: string }
>('auth/resetPassword', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/reset-password', data);

        if (response.status !== 200) {
            throw new Error('Something went wrong, please try again');
        }

        return;
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    await axios.get('/auth/logout');
});

export const changePassword = createAsyncThunk<
    string,
    { oldPassword: string; newPassword: string },
    { rejectValue: string }
>('auth/updatePassword', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/auth/change-password', data);

        if (response.status !== 200) {
            throw new Error('Something went wrong, please try again');
        }

        return response.data.message;
    } catch (error) {
        if (!error.response.data.message) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

export const resetApiKey = createAsyncThunk('auth/resetApiKey', async () => {
    await axios.post('/auth/profile/apiKey');
    // refetch the user profile to get the updated API key
    const response = await axios.get('/auth/profile');
    if (response.status !== 200) {
        throw new Error('Error updating profile details, please try again');
    }
    localStorage.setItem('user', JSON.stringify(response.data));
});

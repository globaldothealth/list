import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getVersion = createAsyncThunk('app/getVersion', async () => {
    const response = await axios.get<string>('/version');
    return response.data;
});

export const getEnv = createAsyncThunk('app/getEnv', async () => {
    const response = await axios.get<string>('/env');
    return response.data;
});

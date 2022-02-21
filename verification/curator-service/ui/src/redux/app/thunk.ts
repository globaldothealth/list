import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getVersion = createAsyncThunk('app/getVersion', async () => {
    const response = await axios.get<string>('/version');
    return response.data;
});

import { createAsyncThunk } from '@reduxjs/toolkit';
import { Case } from '../../api/models/Case';
import axios from 'axios';

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

export const fetchLinelistData = createAsyncThunk<
    ListResponse,
    string | undefined,
    { rejectValue: string }
>('linelist/fetchLinelistData', async (query, { rejectWithValue }) => {
    try {
        const response = await axios.get<ListResponse>(
            `/api/cases${query ? query : ''}`,
        );

        return response.data;
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(error.response.data.message);
    }
});

import { createAsyncThunk } from '@reduxjs/toolkit';
import { Case, VerificationStatus } from '../../api/models/Case';
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

export const changeCasesStatus = createAsyncThunk<
    { newStatus: VerificationStatus; updatedIds: string[] },
    { status: VerificationStatus; caseIds: string[]; note?: string },
    { rejectValue: string }
>('linelist/changeCasesStatus', async (args, { rejectWithValue }) => {
    const { status, caseIds, note } = args;

    try {
        const response = await axios.post('/api/cases/batchStatusChange', {
            status,
            caseIds,
            note,
        });

        if (response.status !== 200) throw new Error(response.data.message);

        return { newStatus: status, updatedIds: caseIds };
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

export const deleteCases = createAsyncThunk<
    string[],
    string[],
    { rejectValue: string }
>('linelist/deleteCases', async (caseIds, { rejectWithValue }) => {
    try {
        const response = await axios.delete('/api/cases', {
            data: { caseIds },
        });

        if (response.status !== 204) throw new Error(response.data.message);

        return caseIds;
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

export const downloadCases = createAsyncThunk<
    void,
    string[],
    { rejectValue: string }
>('linelist/downloadCases', async (caseIds, { rejectWithValue }) => {
    const formData = new FormData();
    caseIds.forEach((caseId) => formData.append('caseIds[]', caseId));

    try {
        await axios({
            method: 'POST',
            url: '/api/cases/download',
            data: formData,
        });

        return;
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

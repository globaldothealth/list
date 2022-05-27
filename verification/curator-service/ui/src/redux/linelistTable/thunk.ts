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
        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});

export const changeCasesStatus = createAsyncThunk<
    { newStatus: VerificationStatus; updatedIds?: string[] },
    {
        status: VerificationStatus;
        caseIds?: string[];
        note?: string;
        query?: string;
    },
    { rejectValue: string }
>('linelist/changeCasesStatus', async (args, { rejectWithValue }) => {
    const { status, caseIds, note, query } = args;

    try {
        const parsedQuery =
            query && query.replace('?', '').replaceAll('=', ':');

        const response = await axios.post('/api/cases/batchStatusChange', {
            status,
            caseIds,
            note,
            query: parsedQuery,
        });

        if (response.status !== 200) throw new Error(response.data.message);

        return { newStatus: status, updatedIds: caseIds };
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});

export const deleteCases = createAsyncThunk<
    void,
    { caseIds?: string[]; query?: string },
    { rejectValue: string }
>('linelist/deleteCases', async (args, { rejectWithValue }) => {
    const { caseIds, query } = args;

    try {
        const parsedQuery =
            query && query.replace('?', '').replaceAll('=', ':');

        const response = await axios.delete('/api/cases', {
            data: { caseIds, query: parsedQuery },
        });

        if (response.status !== 204) throw new Error(response.data.message);

        return;
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});

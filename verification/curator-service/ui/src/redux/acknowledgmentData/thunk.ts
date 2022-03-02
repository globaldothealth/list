import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { AcknowledgmentData } from '../../api/models/AcknowledgmentData';

export const fetchAcknowledgmentData = createAsyncThunk<
    { sources: AcknowledgmentData[]; total: number; nextPage?: number },
    { page: number; limit: number; orderBy: string; order: 'asc' | 'desc' },
    { rejectValue: string }
>(
    'acknowledgment/fetchAcknowledgmentData',
    async ({ page, limit, orderBy, order }, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `/api/acknowledgment-sources?page=${page}&limit=${limit}&orderBy=${orderBy}&order=${order}`,
            );

            if (response.status !== 200 && response.status !== 304) {
                throw new Error(
                    'Error while downloading Acknowledgment Data, please try again',
                );
            }

            return response.data;
            // eslint-disable-next-line
        } catch (error: any) {
            if (!error.response.data.message) throw error;

            return rejectWithValue(error.response.data.message);
        }
    },
);

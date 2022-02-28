import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAcknowledgmentData = createAsyncThunk(
    'filters/fetchAcknowledgmentData',
    async () => {
        const acknowledgementData = await axios.get(
            '/api/acknowledgement-sources',
        );

        return acknowledgementData.data;
    },
);

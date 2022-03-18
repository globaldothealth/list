import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { AcknowledgmentData } from '../../api/models/AcknowledgmentData';

export const fetchAcknowledgmentData = createAsyncThunk<
    AcknowledgmentData[],
    void,
    { rejectValue: string }
>('acknowledgment/fetchAcknowledgmentData', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get<AcknowledgmentData[]>(
            '/api/acknowledgment-sources',
        );

        if (response.status !== 200 && response.status !== 304) {
            throw new Error(
                'Error while downloading Acknowledgment Data, please try again',
            );
        }

        let sources = response.data;

        // Filter sources so that there are no duplicates
        sources = sources.filter(
            (value, index, self) =>
                index ===
                self.findIndex(
                    (el) =>
                        el.origin.providerName === value.origin.providerName,
                ),
        );

        return sources;
        // eslint-disable-next-line
    } catch (error: any) {
        if (!error.response.data.message) throw error;

        return rejectWithValue(error.response.data.message);
    }
});

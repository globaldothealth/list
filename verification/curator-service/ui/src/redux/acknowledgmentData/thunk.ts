import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface AcknowledgementData {
    name: string;
    origin: {
        providerName: string;
        url: string;
        license: string;
    };
    format: string;
}

export const fetchAcknowledgmentData = createAsyncThunk<
    AcknowledgementData[],
    void,
    { rejectValue: string }
>('filters/fetchAcknowledgmentData', async () => {
    const acknowledgementData = await axios.get('/api/acknowledgement-sources');

    if (acknowledgementData.status !== 200) {
        throw new Error(
            'Error downloading Acknowledgment Data, please try again',
        );
    }

    return acknowledgementData.data;
});

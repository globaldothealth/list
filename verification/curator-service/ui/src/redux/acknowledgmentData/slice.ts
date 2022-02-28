import { createSlice } from '@reduxjs/toolkit';
import { fetchAcknowledgmentData } from './thunk';

const initialState = {
    acknowledgmentData: [],
    isLoading: false,
    error: undefined,
};

interface AcknowledgementData {
    name: string;
    origin: {
        url: string;
        license: string;
    };
    format: string;
}

interface initialStateTypes {
    acknowledgmentData: AcknowledgementData[];
    isLoading: boolean;
    error: string | unknown;
}

const slice = createSlice({
    name: 'tableData',
    initialState: initialState as initialStateTypes,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchAcknowledgmentData.fulfilled, (state, action) => {
            state.acknowledgmentData = action.payload;
            state.isLoading = false;
        });
        builder.addCase(fetchAcknowledgmentData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchAcknowledgmentData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

export default slice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { fetchAcknowledgmentData } from './thunk';
import { AcknowledgmentData } from '../../api/models/AcknowledgmentData';

interface AcknowledgementState {
    acknowledgmentData: AcknowledgmentData[];
    isLoading: boolean;
    error: string | undefined;
    nextPage: number | undefined;
    totalSources: number;
}

const initialState: AcknowledgementState = {
    acknowledgmentData: [],
    isLoading: false,
    error: undefined,
    nextPage: undefined,
    totalSources: 0,
};

const slice = createSlice({
    name: 'tableData',
    initialState,
    reducers: {
        resetError: (state) => {
            state.error = undefined;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAcknowledgmentData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(
            fetchAcknowledgmentData.fulfilled,
            (state, { payload }) => {
                state.acknowledgmentData = payload.sources;
                state.totalSources = payload.total;
                state.nextPage = payload.nextPage;
                state.isLoading = false;
            },
        );
        builder.addCase(fetchAcknowledgmentData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

export const { resetError } = slice.actions;

export default slice.reducer;

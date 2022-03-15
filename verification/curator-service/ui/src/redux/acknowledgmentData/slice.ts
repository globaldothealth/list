import { createSlice } from '@reduxjs/toolkit';
import { fetchAcknowledgmentData } from './thunk';
import { AcknowledgmentData } from '../../api/models/AcknowledgmentData';

interface AcknowledgementState {
    acknowledgmentData: AcknowledgmentData[];
    isLoading: boolean;
    error: string | undefined;
}

const initialState: AcknowledgementState = {
    acknowledgmentData: [],
    isLoading: false,
    error: undefined,
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
                state.acknowledgmentData = payload;
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

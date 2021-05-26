import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
    searchQuery: string;
}

const initialState: AppState = {
    searchQuery: '',
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
    },
});

// actions
export const { setSearchQuery } = appSlice.actions;

// reducer
export default appSlice.reducer;

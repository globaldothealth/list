import { createSlice } from '@reduxjs/toolkit';
import {fetchCountries} from './thunk';

const initialState = {
    countryList: [],
    isLoading: false,
    error: undefined,
};

interface initialStateTypes {
    countryList:string[],
    isLoading: boolean,
    error: string | undefined;
  }

const slice = createSlice({
    name: 'filters',
    initialState: initialState as initialStateTypes,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(fetchCountries.fulfilled, (state, action) => {
            state.countryList = action.payload;
            state.isLoading = false;
        })
        builder.addCase(fetchCountries.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        })
        builder.addCase(fetchCountries.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
            ? action.payload
            : action.error.message;
        });
    }
});

export default slice.reducer;
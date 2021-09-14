import { createSlice } from '@reduxjs/toolkit';
import {fetchCountries} from './thunk';

const initialState = {
    countryList: [],
    isLoading: false
};

interface initialStateTypes {
    countryList:string[],
    isLoading: boolean
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
        })
        builder.addCase(fetchCountries.rejected, (state) => {
            state.isLoading = false;
        });
    }
});

export default slice.reducer;
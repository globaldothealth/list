import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    countryList: [],
};

const slice = createSlice({
    name: 'countryList',
    initialState,
    reducers: {
        setCountries(state: any, action) {
            state.countryList = action.payload;
        },
    },
});

export const { setCountries } = slice.actions;
export default slice.reducer;
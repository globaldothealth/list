import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const countryListJsonFile =
    'https://covid-19-aggregates.s3.amazonaws.com/countries-list.json';

export const fetchCountries = createAsyncThunk<
    string[],
    void,
    { rejectValue: string }
>('filters/fetchCountries', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get<string[]>(countryListJsonFile);
        if (response.status !== 200) {
            throw new Error('Something went wrong, please try again');
        }

        const countries = response.data.sort();
        return countries;
        // return countries;
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(error.response.data.message);
    }
});

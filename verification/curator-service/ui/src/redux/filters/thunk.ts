import { createAsyncThunk } from '@reduxjs/toolkit';
import { allCountryNames } from '../../components/util/countryNames';

export const fetchCountries = createAsyncThunk<
    string[],
    void,
    { rejectValue: string }
>('filters/fetchCountries', async (_) => {
    const countries = allCountryNames();
    return Object.keys(countries)
        .map((key) => countries[key])
        .sort();
});

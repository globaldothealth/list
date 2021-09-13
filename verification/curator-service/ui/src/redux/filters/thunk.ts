import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const countryListJsonFile =
    'https://covid-19-aggregates.s3.amazonaws.com/country/latest.json';

type countryObject = {
    _id: string
}

export const fetchCountries = createAsyncThunk(
    'countryList/fetchCountries',
    async (_, { rejectWithValue}) => {
        try {
            const response = await axios.get(countryListJsonFile);            
            const responseArray:[] = Object.entries(response.data)[0][1] as [];
            const countries:string[]= responseArray
                .map((el:countryObject) => {
                    return el._id;
                })
                .sort();

            return countries;
    
        } catch (error) {
            if (!error.response) throw error;
            return rejectWithValue(error.response.data.message);
        }
    },
);
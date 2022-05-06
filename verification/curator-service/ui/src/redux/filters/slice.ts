import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchCountries } from './thunk';

interface initialStateTypes {
    modalOpen: boolean;
    countryList: string[];
    activeFilterInput: string;
    isLoading: boolean;
    error: string | undefined;
}

const initialState = {
    modalOpen: false,
    countryList: [],
    activeFilterInput: '',
    isLoading: false,
    error: undefined,
};

const slice = createSlice({
    name: 'filters',
    initialState: initialState as initialStateTypes,
    reducers: {
        setModalOpen: (state, action: PayloadAction<boolean>) => {
            state.modalOpen = action.payload;
        },
        setActiveFilterInput: (state, action: PayloadAction<string>) => {
            state.activeFilterInput = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCountries.fulfilled, (state, action) => {
            state.countryList = action.payload;
            state.isLoading = false;
        });
        builder.addCase(fetchCountries.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchCountries.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

// actions
export const { setModalOpen, setActiveFilterInput } = slice.actions;

export default slice.reducer;

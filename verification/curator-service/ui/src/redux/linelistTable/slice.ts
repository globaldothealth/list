import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchLinelistData } from './thunk';
import { Case } from '../../api/models/Case';
import { SortBy, SortByOrder } from '../../constants/types';

interface LinelistTableState {
    isLoading: boolean;
    cases: Case[];
    currentPage: number;
    nextPage: number;
    rowsPerPage: number;
    sort: {
        value: SortBy;
        order: SortByOrder;
    };
    searchQuery: string;
    total: number;
    error: string | undefined;
}

const initialState: LinelistTableState = {
    isLoading: false,
    cases: [],
    currentPage: 0,
    nextPage: 1,
    rowsPerPage: 50,
    sort: {
        value: SortBy.ConfirmationDate,
        order: SortByOrder.Descending,
    },
    searchQuery: '',
    total: 0,
    error: undefined,
};

const linelistTableSlice = createSlice({
    name: 'linelist',
    initialState,
    reducers: {
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setRowsPerPage: (state, action: PayloadAction<number>) => {
            state.rowsPerPage = action.payload;
        },
        setSort: (
            state,
            action: PayloadAction<{ value: SortBy; order: SortByOrder }>,
        ) => {
            state.sort = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchLinelistData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchLinelistData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.cases = payload.cases;
            state.nextPage = payload.nextPage;
            state.total = payload.total;
        });
        builder.addCase(fetchLinelistData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

// actions
export const { setCurrentPage, setRowsPerPage, setSort, setSearchQuery } =
    linelistTableSlice.actions;

export default linelistTableSlice.reducer;

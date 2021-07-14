import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChipData } from '../../components/App/App';
import { getUserProfile, logout } from '../../redux/auth/thunk';

interface AppState {
    isLoading: boolean;
    searchQuery: string;
    filterBreadcrumbs: ChipData[];
}

const initialState: AppState = {
    isLoading: false,
    searchQuery: '',
    filterBreadcrumbs: [],
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setFilterBreadcrumbs: (state, action: PayloadAction<ChipData[]>) => {
            state.filterBreadcrumbs = action.payload;
        },
        deleteFilterBreadcrumbs: (state, action: PayloadAction<ChipData>) => {
            state.filterBreadcrumbs = state.filterBreadcrumbs.filter(
                (breadcrumb) => breadcrumb.key !== action.payload.key,
            );
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getUserProfile.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(getUserProfile.fulfilled, (state) => {
            state.isLoading = false;
        });
        builder.addCase(getUserProfile.rejected, (state) => {
            state.isLoading = false;
        });

        builder.addCase(logout.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.isLoading = false;
        });
    },
});

// actions
export const { setSearchQuery, setFilterBreadcrumbs, deleteFilterBreadcrumbs } =
    appSlice.actions;

// reducer
export default appSlice.reducer;

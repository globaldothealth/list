import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChipData } from '../../components/App/App';
import { getUserProfile, logout } from '../../redux/auth/thunk';
import { getVersion, getEnv } from './thunk';

interface AppState {
    isLoading: boolean;
    searchQuery: string;
    filterBreadcrumbs: ChipData[];
    version: string;
    env: string;
}

const initialState: AppState = {
    isLoading: false,
    searchQuery: '',
    filterBreadcrumbs: [],
    version: 'loading…',
    env: 'prod',
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

        builder.addCase(getVersion.fulfilled, (state, action) => {
            state.version = action.payload;
        });
        builder.addCase(getVersion.rejected, (state) => {
            state.version = 'unable to get app version';
        });

        builder.addCase(logout.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.isLoading = false;
        });

        builder.addCase(getEnv.fulfilled, (state, action) => {
            state.env = action.payload;
        });
    },
});

// actions
export const { setSearchQuery, setFilterBreadcrumbs, deleteFilterBreadcrumbs } =
    appSlice.actions;

// reducer
export default appSlice.reducer;

import { configureStore, combineReducers } from '@reduxjs/toolkit';

import appReducer from './app/slice';
import authReducer from './auth/slice';
import filtersReducer from './filters/slice';

export const rootReducer = combineReducers({
    app: appReducer,
    auth: authReducer,
    filtersReducer
});

const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default store;

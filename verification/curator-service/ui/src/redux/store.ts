import { configureStore, combineReducers } from '@reduxjs/toolkit';

import appReducer from './app/slice';
import authReducer from './auth/slice';

export const rootReducer = combineReducers({
    app: appReducer,
    auth: authReducer,
});

const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

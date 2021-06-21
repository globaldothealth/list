import { configureStore, combineReducers } from '@reduxjs/toolkit';
import appReducer from './components/App/redux/appSlice';

export const rootReducer = combineReducers({
    app: appReducer,
});

const store = configureStore({
    reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

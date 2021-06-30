import React, { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
// Import your own reducer
import { rootReducer, RootState } from '../../redux/store';

interface CustomOptions {
    initialState?: RootState;
    store?: any;
    renderOptions?: any;
}

function render(ui: ReactElement, options?: CustomOptions) {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: options?.initialState,
    });

    const renderOptions = options && options.renderOptions;

    function Wrapper(props: { children: ReactElement }) {
        return <Provider store={store}>{props.children}</Provider>;
    }
    return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };

import './index.css';
import 'typeface-roboto';

import * as serviceWorker from './serviceWorker';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { BrowserRouter } from 'react-router-dom';
import store from './redux/store';
import { Provider } from 'react-redux';
import {
    ThemeProvider,
    Theme,
    StyledEngineProvider,
} from '@mui/material/styles';
import { theme } from './theme/theme';
import TagManager from 'react-gtm-module';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const tagManagerArgs = {
    gtmId: 'GTM-WHCJVVH',
};

if (process.env.NODE_ENV === 'production') {
    TagManager.initialize(tagManagerArgs);
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Provider store={store}>
                    <StyledEngineProvider injectFirst>
                        <ThemeProvider theme={theme}>
                            <App />
                        </ThemeProvider>
                    </StyledEngineProvider>
                </Provider>
            </BrowserRouter>
        </React.StrictMode>,
    );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

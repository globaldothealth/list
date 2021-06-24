import './index.css';
import 'typeface-roboto';

import * as serviceWorker from './serviceWorker';

import App from './components/App/App';
import { BrowserRouter } from 'react-router-dom';
import { LastLocationProvider } from 'react-router-last-location';
import React from 'react';
import ReactDOM from 'react-dom';
import store from './store';
import { Provider } from 'react-redux';

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <LastLocationProvider>
                <Provider store={store}>
                    <App />
                </Provider>
            </LastLocationProvider>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

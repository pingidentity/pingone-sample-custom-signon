import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router';
import './index.css';
import config from "./config";
import AppContainer from './containers/container';
import * as serviceWorker from './serviceWorker';

import { combineReducers, applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import freeze from 'redux-freeze';
import reducers from './reducers/index';

const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f;
const composeStore = compose(applyMiddleware(thunk, freeze), devToolsExtension)(createStore);
const store = composeStore(combineReducers(reducers));

const data = {
  branding: {
    logo: config.branding.logo
  },
  authDetails: {
    environmentId: config.authDetails.environmentId,
    responseType: config.authDetails.responseType,
    clientId: config.authDetails.clientId,
    redirectUri: config.authDetails.redirectUri,
    scope: config.authDetails.scope
  }

}

ReactDOM.render(
    <Provider store={store}>
      <MemoryRouter>
        <AppContainer {...data}/>
      </MemoryRouter>
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

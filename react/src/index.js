import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import './index.css';
import config from './config';
import Container from './containers/container';
import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import thunk from 'redux-thunk';
import freeze from 'redux-freeze';
import reducer from './reducers/index';
import {MemoryRouter} from "react-router";

const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f;
const composeStore = compose(applyMiddleware(thunk, freeze), devToolsExtension)(
    createStore);
const store = composeStore(combineReducers(reducer));

render(
    <Provider store={store}>
      <MemoryRouter>
        <Container {...config} />
      </MemoryRouter>
    </Provider>,
    document.getElementById('root')
);

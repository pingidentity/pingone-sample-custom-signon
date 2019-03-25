import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import './index.css';
import config from "./config";
import AppContainer from './containers/container';
import * as serviceWorker from './serviceWorker';

import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import thunk from 'redux-thunk';
import freeze from 'redux-freeze';
import reducer from './reducers/index';
import Callback from "./components/callback";

const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f;
const composeStore = compose(applyMiddleware(thunk, freeze), devToolsExtension)(
    createStore);
const store = composeStore(combineReducers(reducer));

render(
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <Route exact path='/callback' render={(routeProps) =>
              <Callback {...routeProps} {...config}/>}
          />
          <Route render={(routeProps) =>
              <AppContainer {...routeProps}{...config}/>}
          />
        </Switch>
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

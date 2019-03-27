import React from 'react';
import PropTypes from "prop-types";
import {Redirect} from "react-router";
import {PATH} from "./auth";
import api from '../sdk/api'
import {parseHash} from '../sdk/helpers'
import _ from "lodash";
import {STATUS} from "../sdk";

/**
 * React component for managing the return entry point of the implicit OAuth 2.0 flow and is expecting "access_token", "id_token" or "code" in a redirect uri.
 * The user will be redirected to this point based on the redirect_uri in config.js - the URL that specifies the return entry point of this application.
 */
class Callback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: null,
      redirect: null,
      errorMessage: ''
    };

    this.handleSignOff = this.handleSignOff.bind(this);
    this.handleUserInfo = this.handleUserInfo.bind(this);
  }

  getAccessToken() {
    let accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      return api.getAccessToken(
          this.props.authDetails.environmentId,
          this.props.authDetails.clientId,
          this.props.authDetails.clientSecret,
          this.props.authDetails.redirectUri,
          this.props.authDetails.grantType,
          this.props.authDetails.tokenEndpointAuthMethod,
          sessionStorage.getItem("code"))
      .then(token => {
        sessionStorage.setItem("access_token", token.access_token);
        sessionStorage.setItem("id_token", token.id_token);
        sessionStorage.setItem("expires_in", token.expires_in);
        sessionStorage.setItem("scope", token.scope);
        return Promise.resolve(token.access_token);
      })
    } else {
      return Promise.resolve(accessToken);
    }
  }

  handleUserInfo() {
    this.getAccessToken()
    .then(accessToken => {
      return api.getUserInfo(this.props.authDetails.environmentId, accessToken)
    })
    .then(result => {
      this.setState({
        userInfo: result
      });
    })
    .catch(error => {
      const errorDetail = _.get(error, 'details[0].code', null);
      if (_.isEqual(errorDetail, STATUS.INVALID_VALUE)) {
        if (_.get(error, 'details[0].message', null).includes(
            "Access token expired")) {
          this.setState({
            errorMessage: 'Your access token is expired. Please login again.'
          });
        } else {
          this.setState({
            errorMessage: _.get(error, 'details[0].message', null)
          });
        }
      } else if (errorDetail) {
        this.setState({
          errorMessage: errorDetail + _.get(error, 'details[0].message', null)
        });
      } else if (_.get(error, 'error', null) || _.get(error,
          'error_description', null)) {
        this.setState({
          errorMessage: _.get(error, 'error', null) + ': ' + _.get(error,
              'error_description', null)
        });
      }
      return Promise.reject(error);
    })
  }

  handleSignOff() {
    if (sessionStorage.getItem("id_token")) {
      api.signOff(this.props.authDetails.environmentId,
          this.props.authDetails.logoutRedirectUri,
          sessionStorage.getItem("id_token"), sessionStorage.getItem("state"));
    } else {
      this.setState({
        redirect: (
            <Redirect from={PATH.CALLBACK} to={PATH.SIGN_ON}/>)
      });
    }

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("code");
    sessionStorage.removeItem("expires_in");
    sessionStorage.removeItem("scope");
    sessionStorage.removeItem("state");
  }

  componentDidMount() {
    let hashes = parseHash();
    let stateMatch = window.location.href.match('[?#&]state=([^&]*)');
    if (!stateMatch && !stateMatch[1] &&
        !_.isEqual(stateMatch[1], sessionStorage.getItem("state"))) {
      this.setState({
        errorMessage: "State parameter mismatch"
      });
      return;
    }

    let codeMatch = window.location.href.match('[?#&]code=([^&]*)');
    if (hashes && hashes.access_token && hashes.id_token && hashes.expires_in) {
      sessionStorage.setItem("access_token", hashes.access_token);
      sessionStorage.setItem("id_token", hashes.id_token);
      sessionStorage.setItem("expires_in", hashes.expires_in);
      sessionStorage.setItem("scope", hashes.scope);
    } else if (codeMatch && codeMatch[1]) {
      sessionStorage.setItem("code", codeMatch[1]);
    }
    // Replace current URL without adding it to history entries
    window.history.replaceState({}, '', '/callback');
  }

  render() {
    const {userInfo, redirect, errorMessage} = this.state;
    // Redirect user to login page in case of access,id tokens or code absence
    if (!(sessionStorage.getItem("access_token") && sessionStorage.getItem(
        "id_token") && !/access_token|id_token/.test(
        window.location.hash)) && !sessionStorage.getItem("code")
        && !/code/.test(
            window.location.href)) {
      return (<Redirect to={PATH.SIGN_ON}/>);
    }

    const alert = errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>);

    const userData = userInfo && (
        <div className="input-field">
          <table className="table">
            <thead>
            <tr>
              <th>Claim</th>
              <th>Value</th>
            </tr>
            </thead>
            <tbody>
            {Object.keys(userInfo).map(key => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{userInfo[key]}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
    );

    return (
        <div className="container">
          {redirect}
          {alert}
          <div className="home-app">
            <em>
              Hello there!
            </em>
            <p/>
            <form>
              <div className="input-group">
                <button
                    className="btn btn-primary user-credentials-submit"
                    data-id="user-credentials-submit"
                    type="button"
                    onClick={this.handleSignOff}>
                  Sign Off
                </button>
              </div>
            </form>

            <div className="input-field" id="user-info">
              <a href="#"
                 onClick={this.handleUserInfo}
                 id="show-user-info">
                Get user information
              </a>
            </div>
            {userData}
          </div>
        </div>

    );
  }
}

Callback.propTypes = {
  authDetails: PropTypes.shape({
    environmentId: PropTypes.string.isRequired,
    clientId: PropTypes.string.isRequired,
    clientSecret: PropTypes.string,
    scope: PropTypes.string.isRequired,
    responseType: PropTypes.string.isRequired,
    tokenEndpointAuthMethod: PropTypes.string.isRequired,
    grantType: PropTypes.string,
    prompt: PropTypes.string,
    redirectUri: PropTypes.string,
    logoutRedirectUri: PropTypes.string,
    maxAge: PropTypes.number,
    //stateParam: PropTypes.string
  }).isRequired
};

export default Callback;

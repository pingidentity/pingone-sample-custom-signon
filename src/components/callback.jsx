import React from 'react';
import PropTypes from "prop-types";
import {Redirect} from "react-router";
import {PATH} from "./auth";
import api from '../sdk/api'
import {generateRandomValue, parseHash} from '../sdk/helpers'
import _ from "lodash";
import {STATUS} from "../sdk";

/**
 * React component for managing the return entry point of the implicit OAuth 2.0 flow and is expecting "access_token" and "id_token" in a redirect uri.
 * The user will be redirected to this point based on the redirect_uri in config.js - the URL that specifies the return entry point of this application.
 */
class Callback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: null,
      errorMessage: ''
    };

    this.handleSignOff = this.handleSignOff.bind(this);
    this.handleUserInfo = this.handleUserInfo.bind(this);
  }

  handleUserInfo() {
    let accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      accessToken = api.getAccessToken(
          this.props.authDetails.environmentId,
          this.props.authDetails.clientId,
          this.props.authDetails.clientSecret,
          this.props.authDetails.redirectUri,
          this.props.authDetails.responseType,
          this.props.authDetails.grantType,
          this.props.authDetails.scope,
          sessionStorage.getItem("state"),
          this.props.authDetails.prompt,
          this.props.authDetails.maxAge);
    }
    api.getUserInfo(this.props.authDetails.environmentId, accessToken)
    .then(result => {
      this.setState({
        userInfo: result
      });
    })
    .catch(error => {
      const errorDetail = _.get(error, 'details[0].code', null);
      if (_.isEqual(errorDetail, STATUS.INVALID_VALUE)) {
        if (_.get(error, 'details[0].message', null).includes("Access token expired")){
          this.setState({
            errorMessage: 'Your access token is expired. Please login again.'
          });
        } else {
          this.setState({
            errorMessage: _.get(error, 'details[0].message', null)
          });
        }
      } else {
        this.setState({
          errorMessage: errorDetail + _.get(error, 'details[0].message', null)
        });
      }
    });
  }

  handleSignOff() {
    api.signOff(this.props.authDetails.environmentId,
        this.props.authDetails.logoutRedirectUri,
        sessionStorage.getItem("id_token"), sessionStorage.getItem("state"));

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("expires_in");
    sessionStorage.removeItem("scope");
    sessionStorage.removeItem("state");
  }

  componentDidMount() {
    let hashes = parseHash();
    if (hashes && hashes.access_token && hashes.id_token && hashes.expires_in) {
      sessionStorage.setItem("access_token", hashes.access_token);
      sessionStorage.setItem("id_token", hashes.id_token);
      sessionStorage.setItem("expires_in", hashes.expires_in);
      sessionStorage.setItem("scope", hashes.scope);

      let state = generateRandomValue();
      sessionStorage.setItem("state", state);

      window.history.replaceState({}, '', '#done');
    }
  }

  render() {
    const {userInfo, errorMessage} = this.state;
    // Redirect user to login page in case of  access or id tokens absence
    if (!(sessionStorage.getItem("access_token") && sessionStorage.getItem(
        "id_token")) && !/access_token|id_token/.test(
        window.location.hash)) {
      return (<Redirect to={PATH.SIGN_ON}/>);
    }

    const alert = errorMessage && (<div className="alert alert-danger">{errorMessage}</div>);

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
    grantType: PropTypes.string,
    prompt: PropTypes.string,
    redirectUri: PropTypes.string,
    logoutRedirectUri: PropTypes.string,
    maxAge: PropTypes.number
  }).isRequired
};

export default Callback;

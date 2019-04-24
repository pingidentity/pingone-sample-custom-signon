import React from 'react';
import api from '../sdk/api'
import PropTypes from 'prop-types';
import _ from "lodash";

/**
 * React component for managing the return entry point of the implicit OAuth 2.0 flow and is expecting "access_token", "id_token" or "code" in a redirect uri.
 * The user will be redirected to this point based on the redirect_uri in config.js - the URL that specifies the return entry point of this application.
 */
class UserInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: null,
      errorMessage: ''
    };

    this.handleUserInfo = this.handleUserInfo.bind(this);
    this.hideUserInfo = this.hideUserInfo.bind(this);
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

  hideUserInfo() {
    this.setState({
      userInfo: null
    });
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
      if (_.isEqual(errorDetail, 'INVALID_VALUE')) {
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

  render() {
    const {userInfo, errorMessage} = this.state;
    let alert = errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>
    );
    return userInfo ? (
        <div>
          {alert}
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
          <div className="input-field">
            <button type="button" onClick={this.hideUserInfo}> Hide User
              Information
            </button>
          </div>
        </div>
    ) : (
        <div className="input-field">
          {alert}
          <button type="button" onClick={this.handleUserInfo}> Show User
            Information
          </button>
        </div>
    )

  }
}

UserInfo.propTypes = {
  authDetails: PropTypes.shape({
    environmentId: PropTypes.string.isRequired,
    clientId: PropTypes.string.isRequired,
    clientSecret: PropTypes.string,
    scope: PropTypes.string.isRequired,
    responseType: PropTypes.string,
    tokenEndpointAuthMethod: PropTypes.string.isRequired,
    grantType: PropTypes.string,
    prompt: PropTypes.string,
    redirectUri: PropTypes.string,
    logoutRedirectUri: PropTypes.string,
    maxAge: PropTypes.number
  }).isRequired
};

export default UserInfo;

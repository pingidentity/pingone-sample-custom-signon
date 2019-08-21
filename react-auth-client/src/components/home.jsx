import React from 'react';
import authClient from '../sdk/api'
import PropTypes from 'prop-types';
import _ from "lodash";
import InfoTable from "./infoTable";
import config from "../config";

/**
 * React component for managing the return entry point of the implicit OAuth 2.0 flow and is expecting "access_token", "id_token" or "code" in a redirect uri.
 * The user will be redirected to this point based on the redirect_uri in config.js - the URL that specifies the return entry point of this application.
 */
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      access_token: null,
      id_token: null,
      idTokenJson: null,
      userInfo: null,
      errorMessage: ''
    }

    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleSignOff = this.handleSignOff.bind(this);
  }

  handleSignIn() {
    this.clearSession();
    let state = authClient.generateRandomValue();
    let nonce = authClient.generateRandomValue();
    // Store state and nonce parameters into the session, so we can retrieve them after
    // user will be redirected back with access token or code (since react state is cleared in this case)
    sessionStorage.setItem("state", state);
    sessionStorage.setItem("nonce", nonce);

    authClient.authorize(state, nonce);
  }

  handleSignOff() {
    if (this.state.id_token) {
      authClient.signOff(this.state.id_token, sessionStorage.getItem("state"));
    }
    this.clearSession();
  }

  clearSession() {
    this.setState({
      access_token: null,
      id_token: null,
      errorMessage: ''
    });
  }

  componentDidMount() {
    const hashes = authClient.parseHash();
    if (hashes.error && hashes.error_description) {
      this.setState({
        errorMessage: hashes.error + ': ' + hashes.error_description,
      });
      return;
    }

    const stateMatch = window.location.href.match('[?#&]state=([^&]*)');
    if (stateMatch && !stateMatch[1] &&
        !_.isEqual(stateMatch[1], sessionStorage.getItem("state"))) {
      this.setState({
        errorMessage: "State parameter mismatch. "
      });
      this.clearSession();
      return;
    }

    const codeMatch = window.location.href.match('[?#&]code=([^&]*)');
    // Implicit flow: access token is present in URL
    if (hashes.access_token) {
      this.setState({
        access_token: hashes.access_token
      })
      this.handleUserInfo(hashes.access_token);
    }
    // Authorization code flow: access code is present in URL
    else if (codeMatch && codeMatch[1]) {
      authClient.getAccessToken(codeMatch[1])
      .then(token => {
        this.setState({
          access_token: token.access_token,
          id_token: token.id_token
        });
        this.handleUserInfo(token.access_token);
        this.verifyToken(token.id_token);
      })
      .catch(error => {
        this.setState({
          errorMessage: "Couldn't get an access token. " + _.get(error,
              'error_description', _.get(error, 'message', ''))
        })
      });
    }

    if (hashes.id_token) {
      this.verifyToken(hashes.id_token);
    }
    // Replace current URL without adding it to history entries
    window.history.replaceState({}, '', '/');
  }

  verifyToken(id_token) {
    authClient.verifyIdToken(id_token,
        {
          nonce: sessionStorage.getItem("nonce"),
          maxAge: config.maxAge
        })
    .then(idToken => {
      this.setState({
        idTokenJson: idToken
      })
    })
    .catch(error => {
      this.setState({
        errorMessage: "Id token verification failed. " + _.get(error,
            'error_description', _.get(error, 'message', error))
      })
    })
  }

  handleUserInfo(access_token) {
    authClient.getUserInfo(access_token)
    .then(result => {
      this.setState({
        userInfo: result
      })
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
    const {errorMessage, access_token, idTokenJson, userInfo} = this.state;
    const alert = errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>
    );

    const content = access_token ?
        (
            <div className="home-app">
              <em>
                Congratulations! This is a secure resource.
              </em>
              <p/>
              <div className="input-field">
                <button type="button" onClick={this.handleSignOff}> Sign Off
                </button>
              </div>
              <InfoTable btnLabel={'User Information'} data={userInfo}/>
              <InfoTable btnLabel={'User Id Token Information'}
                         data={idTokenJson}/>
            </div>
        ) :
        (
            <div id="signInView">
              <p>You are not currently authenticated. Click Sign On to get
                started.</p>
              <div className="input-field">
                <button type="button" onClick={this.handleSignIn}>Sign On
                </button>
              </div>
            </div>
        );

    return (
        <div className="container">
          <h1>PingOne for Customers OIDC Sample</h1>
          {alert}
          {content}
        </div>
    )
  }
}

Home.propTypes = {
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
};

export default Home;

import React from 'react';
import PropTypes from "prop-types";
import {Redirect} from "react-router";
import {PATH} from "./auth";
import api from '../sdk/api'
import { parseHash } from '../sdk/helpers'

class Callback extends React.Component {
  constructor(props) {
    super(props);

    this.handleSignOff = this.handleSignOff.bind(this);
    this.handleUserInfo = this.handleUserInfo.bind(this);
  }

  handleUserInfo() {
    let accessToken = sessionStorage.getItem("access_token");
    if(!accessToken){
      accessToken = api.getAccessToken(this.props.authDetails.environmentId, this.props.authDetails.clientId,
          this.props.authDetails.clientSecret, this.props.authDetails.redirectUri,
          this.props.authDetails.responseType, this.props.authDetails.grantType, this.props.authDetails.scope,
          sessionStorage.getItem("state"), this.props.authDetails.prompt);
    }
    api.getUserInfo(this.props.authDetails.environmentId, accessToken)
    .then(result =>{
      let htmlString = '\n<table class="table"><tr>'
          + '<th>Claim</th><th>Value</th></tr>';
      for (let claim in result) {
        htmlString = htmlString + '\n<tr><td>' + claim + '</td><td>' + result[claim]
            + '</td></tr>';
      }
      htmlString = htmlString + '\n</table>';
      let userData = document.createElement('p');
      userData.innerHTML = htmlString;

      document.getElementById('user-info').appendChild(
          document.createElement('div').appendChild(userData)
      );
    })
  }

  handleSignOff() {
    api.signOff(this.props.authDetails.environmentId,
        this.props.authDetails.logoutRedirectUri, sessionStorage.getItem("id_token"), sessionStorage.getItem("state"));

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("expires_in");
    sessionStorage.removeItem("scope");
    sessionStorage.removeItem("state");

    window.history.replaceState({}, '', '/');

  }

  componentDidMount(){
    let hashes = parseHash();
    if(hashes && hashes.access_token && hashes.id_token && hashes.expires_in){
      sessionStorage.setItem("access_token",hashes.access_token);
      sessionStorage.setItem("id_token", hashes.id_token);
      sessionStorage.setItem("expires_in", hashes.expires_in);
      sessionStorage.setItem("scope", hashes.scope);
      window.history.replaceState({}, '', '#done');
    }
  }

  render() {

    if (/signedOff/.test(window.location.hash) ||
        (!(sessionStorage.getItem("access_token") && sessionStorage.getItem("id_token")) && !/access_token|id_token/.test(window.location.hash))) {
      window.history.replaceState({}, '', '/');
      return  (<Redirect to={PATH.SING_ON} />);
    }

    return (
        <div className="container">
          <div className="home-app">
            <em>
              Hello there!
            </em>
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
    logoutRedirectUri: PropTypes.string
  }).isRequired
};

export default Callback;

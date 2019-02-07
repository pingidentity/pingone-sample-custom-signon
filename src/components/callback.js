import React from 'react';
import PropTypes from "prop-types";
import {Redirect} from "react-router";
import {PATH} from "./app";

class Callback extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: ''
    };

    this.handleSignOff = this.handleSignOff.bind(this);
  }

  handleSignOff() {
    const {
      userActions,
      authDetails
    } = this.props;

    userActions.signOff(authDetails.environmentId,
        authDetails.logoutRedirectUri, sessionStorage.getItem("id_token"), sessionStorage.getItem("state"));

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("expires_in");
    sessionStorage.removeItem("scope");
    sessionStorage.removeItem("state");

    window.history.replaceState({}, '', '/');

  }

  componentDidMount(){
    let hashes = this.parseHash();
    if(hashes && hashes.access_token && hashes.id_token && hashes.expires_in){
      sessionStorage.setItem("access_token",hashes.access_token);
      sessionStorage.setItem("id_token", hashes.id_token);
      sessionStorage.setItem("expires_in", hashes.expires_in);
      sessionStorage.setItem("scope", hashes.scope);
      window.history.replaceState({}, '', '#done');
    } else {

    }
  }

  parseHash(){
    return window.location.hash.replace('#', '').split('&').reduce((prev, item) => {
      return Object.assign({[item.split('=')[0]]: item.split('=')[1]}, prev);
    }, {});
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
            <div>
              Hello
            </div>
            <form>
              <div className="input-group">
                <button
                    className="btn btn-primary user-credentials-submit"
                    data-id="user-credentials-submit"
                    type="button"
                    onClick={this.handleSignOff}
                >
                  Sign Off
                </button>
              </div>
            </form>
          </div>
        </div>

    );
  }
}

Callback.propTypes = {
  userActions: PropTypes.shape({
    signOff: PropTypes.func.isRequired
  }).isRequired,
  authDetails: PropTypes.shape({
    environmentId: PropTypes.string.isRequired,
    logoutRedirectUri: PropTypes.string
  }).isRequired,
};

export default Callback;

import React from 'react';
import PropTypes from 'prop-types';
import {Redirect, Route} from 'react-router';
import _ from 'lodash';
import { parseHash, generateRandomValue } from '../sdk/helpers'

import UserLogin from './userLogin';
import ForgotPassword from './forgotPassword'
import MessageBlock from './message'
import PasswordEditor from './password'
import RecoveryCodeAndPasswordForm from './recoveryCodeAndPassword'
import RegistrationForm from './registration'
import VerificationCode from './verificationCode'

export const PATH = {
  SING_ON: '/',
  EXPIRED: '/expired',
  UNABLE_TO_SIGN_IN: '/unableToSignIn',
  CHANGE_PASSWORD: '/changePassword',
  REGISTER: '/register',
  VERIFY: '/verify',
  FORGOT_PASSWORD_USERNAME: '/forgotPasswordUsername',
  RECOVERY_CODE_AND_PASSWORD: '/recoveryCode'
};

// Maps each initial status to list of compatible paths; 1st path in list is default
export const STATUS_TO_COMPATIBLE_PATHS = {
  PASSWORD_EXPIRED: [PATH.EXPIRED],
  MUST_CHANGE_PASSWORD: [PATH.CHANGE_PASSWORD],
  USERNAME_PASSWORD_REQUIRED: [PATH.SING_ON, PATH.REGISTER, PATH.VERIFY,
    PATH.UNABLE_TO_SIGN_IN,
    PATH.FORGOT_PASSWORD_USERNAME],
  PASSWORD_REQUIRED: [PATH.SING_ON],
  RECOVERY_CODE_REQUIRED: [PATH.RECOVERY_CODE_AND_PASSWORD],
  VERIFICATION_CODE_REQUIRED: [PATH.VERIFY],
  COMPLETED: [PATH.SING_ON]
};

class Auth extends React.Component {

  componentDidUpdate() {
    this.authenticate();
  }

  componentDidMount() {
    this.authenticate();
  }

  authenticate(){
    const {authState, authDetails, authActions} = this.props;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const flow = authState.flow;
    const error = window.location.href.includes('&error=');
    const signedOff = window.location.hash === '#signedOff';
    const notSigned = !/access_token|id_token|error|done/.test(window.location.hash);

    if (!uuidRegex.test(authDetails.environmentId)) {
      authActions.unrecoverableError(new Error(
          `Invalid environmentId parameter: it should be a valid UUID.`));
    } else if (!error && !signedOff && flow && !uuidRegex.test(flow.id)) {
      authActions.unrecoverableError(new Error(
          `Invalid flowId parameter: ${flow.id}. flowId should be a valid UUID.`));
    } else if (!flow && notSigned) {
      let state = generateRandomValue();
      sessionStorage.setItem("state", state);

      authActions.authorize(authDetails.environmentId,
          authDetails.responseType, authDetails.clientId,
          authDetails.redirectUri, authDetails.scope, state);
    }
  }

  render() {
    const {authState, location, branding} = this.props;

    if (/error/.test(window.location.hash)) {
      let errorMsg = parseHash();
      return <MessageBlock messageType={"error"} message={errorMsg.error + ': ' + errorMsg.error_description}/>;
    } else if (/signedOff/.test(window.location.hash)) {
      return <MessageBlock messageType={"success"} message="You successfully signed off and you can now close this browser tab."/>;
    }
    else if (!_.isEmpty(window.location.search)){
      // Clear current history entry before further operations
      window.history.replaceState({}, '', '/');
    }

    const message = _.get(authState, 'message', null);
    const unrecoverableError = _.get(authState, 'unrecoverableError', null);

    if (unrecoverableError || (message && message.isError)) {
      return <MessageBlock messageType={"error"} message={unrecoverableError ? unrecoverableError : message.content}/>;
    }

    const flow = _.get(authState, 'flow', null);
    const isAuthenticated = _.get(authState, 'isAuthenticated', null);

    if (flow) {
      const currentViewPath = STATUS_TO_COMPATIBLE_PATHS[_.get(flow, 'status', 'unknown')];
      // Check there other than sign on flows were completed, like reset password or new user creation
      const notSignOnFlowCompleted = !isAuthenticated && flow.isCompleted() && !_.isEqual(location.pathname, PATH.SING_ON);
      if ( !currentViewPath || notSignOnFlowCompleted) {
        return (<div>
          <Redirect to={PATH.SING_ON}/>
        </div>);
      } else if (!(_.some(currentViewPath, (path) => _.startsWith(path, location.pathname))) && !isAuthenticated) {
        return (<div>
         <Redirect to={currentViewPath[0]}/>
        </div>)
      }

      if (flow.isCompleted() && isAuthenticated) {
        // Redirect to the resume endpoint
        window.location.assign(flow.resumeUrl);
        return null;
      }
    }

    return flow && (
        <div className="container">
          <div className="row">
            <img className="logo" src={branding.logo} alt="logo"/>
          </div>
          <div className="row routes">
            <Route path={PATH.SING_ON} exact
                   render={(routeProps) =>
                       <UserLogin {...routeProps}{...this.props}
                                  flow={flow}
                                  message={message}/>}/>
            <Route path={PATH.CHANGE_PASSWORD} exact
                   render={(routeProps) =>
                       <PasswordEditor {...routeProps}{...this.props}
                                       flow={flow} />}/>
            <Route
                path={PATH.FORGOT_PASSWORD_USERNAME}
                exact
                render={(routeProps) =>
                    (<ForgotPassword
                        {...routeProps}{...this.props}
                        flow={flow}
                    />)
                }
            />
            <Route
                path={PATH.EXPIRED}
                exact
                render={(routeProps) =>
                    (<PasswordEditor
                        {...routeProps}{...this.props}
                        flow={flow}
                        feedbackMessage="Your password has expired. Please create a new one."
                    />)
                }
            />
            <Route
                path={PATH.REGISTER}
                exact
                render={(routeProps) =>
                    (<RegistrationForm
                        {...routeProps}{...this.props}
                        flow={flow}
                    />)
                }
            />
            <Route
                path={PATH.VERIFY}
                exact
                render={(routeProps) =>
                    (<VerificationCode
                        {...routeProps}{...this.props}
                        flow={flow}
                    />)
                }
            />
            <Route
                path={PATH.RECOVERY_CODE_AND_PASSWORD}
                exact
                render={(routeProps) =>
                    (<RecoveryCodeAndPasswordForm
                        {...routeProps}{...this.props}
                        flow={flow}
                    />)
                }
            />
            <Route path={PATH.UNABLE_TO_SIGN_IN} exact
                   component={MessageBlock}/>
          </div>
        </div>
    );
  }

};

Auth.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      currentPassword: PropTypes.string,
      username: PropTypes.string,
    }),
  }).isRequired,

  branding: PropTypes.shape({
    logo: PropTypes.string.isRequired,
  }).isRequired,

  authDetails: PropTypes.shape({
    environmentId: PropTypes.string.isRequired,
    clientId: PropTypes.string.isRequired,
    clientSecret: PropTypes.string,
    scope: PropTypes.string.isRequired,
    grantType: PropTypes.string,
    prompt: PropTypes.string,
    responseType: PropTypes.string.isRequired,
    redirectUri: PropTypes.string.isRequired,
    logoutRedirectUri: PropTypes.string
  }).isRequired,

  authActions: PropTypes.shape({
    unrecoverableError: PropTypes.func.isRequired,
    authorize: PropTypes.func.isRequired,
  }).isRequired,

  authState: PropTypes.shape({
    flow: PropTypes.shape({
      status: PropTypes.string,
    }),
    error: PropTypes.shape({}),
  }),
};

Auth.defaultProps = {
  authState: null,
};

export default Auth;

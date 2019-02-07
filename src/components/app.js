import React from 'react';
import PropTypes from 'prop-types';
import {Redirect, Route} from 'react-router';
import UserLogin from './userLogin';
import ForgotPassword from './forgotPassword'
import MessageBlock from './message'
import PasswordEditor from './password'
import RecoveryCodeAndPasswordForm from './recoveryCodeAndPassword'
import RegistrationForm from './registration'
import VerificationCode from './verificationCode'
import _ from 'lodash';
import Callback from "./callback";

export const PATH = {
  ERROR: '/error',

  CALLBACK: '/callback',

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
  COMPLETED: [PATH.CALLBACK],
};

class App extends React.Component {

  componentDidMount() {
    const {flowState, authDetails, userActions} = this.props;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const flow = flowState.flow;
    const error = window.location.href.includes('&error=');
    const signedOff = window.location.hash === '#signedOff';

    if (!uuidRegex.test(authDetails.environmentId)) {
      userActions.unrecoverableError(new Error(
          `Invalid environmentId parameter: it should be a valid UUID.`));
    } else if (!error && !signedOff && flow && !uuidRegex.test(flow.id)) {
      userActions.unrecoverableError(new Error(
          `Invalid flowId parameter: ${flow.id}. flowId should be a valid UUID.`));
    } else if (!flow && !/access_token|id_token|error|done/.test(window.location.hash)) {
      let state = this.generateRandomValue();
      sessionStorage.setItem("state", state);

      userActions.clientAuth(authDetails.environmentId,
          authDetails.responseType, authDetails.clientId,
          authDetails.redirectUri, authDetails.scope, state);
    }
  }

  generateRandomValue () {
    let crypto = window.crypto || window.msCrypto;
    let D = new Uint32Array(2);
    crypto.getRandomValues(D);
    return D[0].toString(36);
  }

  render() {
    const {flowState, location, branding, userActions, authDetails} = this.props;

    if (/signedOff/.test(window.location.hash)) {
      return <MessageBlock messageType={"success"} message="You successfully signed off and you can now close this browser tab."/>;
    }
    else if (/access_token|id_token|error|done/.test(window.location.hash)) {
      return (
          <div>
            <Callback userActions={userActions} authDetails={authDetails}/>
          </div>
      );
    }

    const unrecoverableError = _.get(flowState, 'unrecoverableError', null);

    const flow = _.get(flowState, 'flow', null);
    const isAuthenticated = _.get(flowState, 'isAuthenticated', null);
    const message = _.get(flowState, 'message', null);

    if (unrecoverableError) {
      return <MessageBlock messageType={"error"} message={unrecoverableError}/>;
    }

    if (flow) {

      const currentViewPath = STATUS_TO_COMPATIBLE_PATHS[_.get(flow, 'status',
          'unknown')];
      if (!currentViewPath && !isAuthenticated) {
        return (<div>
          <Redirect to={PATH.SING_ON}/>
        </div>);
      } else if (!(_.some(currentViewPath, (path) => _.startsWith(location.pathname, path)))) {
        return (<div>
         <Redirect to={currentViewPath[0]}/>
        </div>)
      }

      if (flow.isCompleted()) {
        // Redirect to the resume endpoint
        window.location.assign(flow.resumeUrl);
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
            <Route
                path={PATH.CALLBACK}
                exact
                render={(routeProps) =>
                    (<Callback
                        {...routeProps}{...this.props}
                    />
                    )
                }
            />
            <Route path={PATH.UNABLE_TO_SIGN_IN} exact
                   component={MessageBlock}/>
          </div>
          {/*{redirect}*/}
        </div>
    );
  }

};

App.propTypes = {
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
    scope: PropTypes.string.isRequired,
    responseType: PropTypes.string.isRequired,
    redirectUri: PropTypes.string
  }).isRequired,

  userActions: PropTypes.shape({
    changeUserPassword: PropTypes.func.isRequired,
  }).isRequired,

  flowState: PropTypes.shape({
    flow: PropTypes.shape({
      status: PropTypes.string,
    }),
    error: PropTypes.shape({}),
  }),
};

App.defaultProps = {
  flowState: null,
};

export default App;

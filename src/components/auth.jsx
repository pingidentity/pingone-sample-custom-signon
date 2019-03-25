import React from 'react';
import PropTypes from 'prop-types';
import {Redirect, Route} from 'react-router';
import _ from 'lodash';
import {parseHash} from '../sdk/helpers'

import UserLogin from './userLogin';
import ForgotPassword from './forgotPassword'
import MessageBlock from './message'
import PasswordEditor from './password'
import RecoveryCodeAndPasswordForm from './recoveryCodeAndPassword'
import RegistrationForm from './registration'
import VerificationCode from './verificationCode'

export const PATH = {
  SIGN_ON: '/',
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
  USERNAME_PASSWORD_REQUIRED: [PATH.SIGN_ON, PATH.REGISTER, PATH.VERIFY,
    PATH.UNABLE_TO_SIGN_IN, PATH.FORGOT_PASSWORD_USERNAME],
  PASSWORD_REQUIRED: [PATH.SIGN_ON],
  RECOVERY_CODE_REQUIRED: [PATH.RECOVERY_CODE_AND_PASSWORD],
  VERIFICATION_CODE_REQUIRED: [PATH.VERIFY],
  COMPLETED: [PATH.SIGN_ON]
};

class Auth extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
    }
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.authState, prevProps.authState) ||
        !_.isEqual(this.props.authDetails, prevProps.authDetails)) {
      this.authorize();
    }
  }

  componentDidMount() {
    this.authorize();
  }

  shouldAuthorize() {
    const {authState, authDetails} = this.props;

    const flow = authState.flow;
    const notSignedIn = !/access_token|id_token|error|done/.test(
        window.location.hash);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let shouldAuthorize = false;
    if (!uuidRegex.test(authDetails.environmentId)) {
      this.setState({
        errorMessage: `Invalid environmentId parameter ${authDetails.environmentId} : it should be a valid UUID.  Please check it in your config.js parameters file.`,
      });
    } else if (flow && !uuidRegex.test(flow.id)) {
      this.setState({
        errorMessage: `Invalid flowId parameter ${flow.id} : it should be a valid UUID. Please contact PingOne for Customers Developers Support. `,
      });
    } else if (!flow && notSignedIn) {
      shouldAuthorize = true;
    }

    return shouldAuthorize;
  }

  authorize() {
    const {authDetails, authActions} = this.props;

    if (this.shouldAuthorize()) {
      authActions.authorize(authDetails.environmentId,
          authDetails.responseType, authDetails.clientId,
          authDetails.redirectUri, authDetails.scope)
      .catch(err => {
        this.setState({
          errorMessage: `An unexpected error has occurred. ${err}`,
        });
      });
    }
  }

  render() {
    const {errorMessage} = this.state;
    const {authState, location, branding} = this.props;

    if (errorMessage) {
      return <MessageBlock messageType={"error"} message={errorMessage}/>;
    } else if (/error/.test(window.location.hash)) {
      let errorMsg = parseHash();
      return <MessageBlock messageType={"error"} message={errorMsg.error + ': '
      + errorMsg.error_description}/>;
    } else if (!_.isEmpty(window.location.search)) {
      // Clear current history entry before further operations
      window.history.replaceState({}, '', '/');
    }

    const flow = _.get(authState, 'flow', null);
    const isAuthenticated = _.get(authState, 'isAuthenticated', null);
    const message = _.get(authState, 'message', null);

    if (flow) {
      const currentViewPath = STATUS_TO_COMPATIBLE_PATHS[_.get(flow, 'status',
          'unknown')];
      // Check the use case when user is not signed in, but the flow like reset password or new user creation is completed,
      // to set an application on the sign in page again
      const managementFlowCompleted = !isAuthenticated && flow.isCompleted();
      if (!currentViewPath ||
          (!_.isEqual(location.pathname, PATH.SIGN_ON) && managementFlowCompleted)) {
        return (<div>
          <Redirect to={PATH.SIGN_ON}/>
        </div>);
      } else if (!(_.some(currentViewPath,
          (path) => _.startsWith(path, location.pathname)))
          && !isAuthenticated) {
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
            <Route path={PATH.SIGN_ON} exact
                   render={(routeProps) =>
                       <UserLogin {...routeProps}{...this.props}
                                  flow={flow} message={message}/>}/>
            <Route path={PATH.CHANGE_PASSWORD} exact
                   render={(routeProps) =>
                       <PasswordEditor {...routeProps}{...this.props}
                                       flow={flow} message={message}/>}/>
            <Route
                path={PATH.FORGOT_PASSWORD_USERNAME}
                exact
                render={(routeProps) =>
                    (<ForgotPassword
                        {...routeProps}{...this.props}
                        flow={flow} message={message}
                    />)
                }
            />
            <Route
                path={PATH.EXPIRED}
                exact
                render={(routeProps) =>
                    (<PasswordEditor
                        {...routeProps}{...this.props}
                        flow={flow} message={message}
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
                        flow={flow} message={message}
                    />)
                }
            />
            <Route
                path={PATH.VERIFY}
                exact
                render={(routeProps) =>
                    (<VerificationCode
                        {...routeProps}{...this.props}
                        flow={flow} message={message}
                    />)
                }
            />
            <Route
                path={PATH.RECOVERY_CODE_AND_PASSWORD}
                exact
                render={(routeProps) =>
                    (<RecoveryCodeAndPasswordForm
                        {...routeProps}{...this.props}
                        flow={flow} message={message}
                    />)
                }
            />
            <Route path={PATH.UNABLE_TO_SIGN_IN} exact
                   component={MessageBlock}
            />
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
    authorize: PropTypes.func.isRequired,
  }).isRequired,

  authState: PropTypes.shape({
    flow: PropTypes.shape({
      status: PropTypes.string,
    })
  }),
};

Auth.defaultProps = {
  authState: null,
};

export default Auth;

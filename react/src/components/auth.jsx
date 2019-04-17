import React from 'react';
import PropTypes from 'prop-types';
import {Redirect, Route} from 'react-router';
import _ from 'lodash';
import {getURLParameter} from '../sdk/helpers'

import UserLogin from './userLogin';
import ForgotPassword from './forgotPassword'
import MessageBlock from './message'
import PasswordEditor from './updatePassword'
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
  VERIFICATION_CODE_REQUIRED: [PATH.VERIFY]
};

class Auth extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
    }
  }

  componentDidMount() {
    const environmentId = getURLParameter('environmentId');
    const flowId = getURLParameter('flowId');
    const error = getURLParameter('error');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (error) {
      this.setState({
        errorMessage: JSON.parse(decodeURIComponent(error))
      })
    } else if (!uuidRegex.test(environmentId)) {
      this.setState({
        errorMessage: `Invalid environmentId parameter: ${environmentId}. environmentId should be a valid UUID.`
      })

    } else if (!error && !uuidRegex.test(flowId)) {
      this.setState({
        errorMessage: `Invalid flowId parameter: ${flowId}. flowId should be a valid UUID.`
      })

    } else if (!this.props.authState.flow) {
      this.props.authActions.getFlow(environmentId, flowId)
      .catch(error => {
        if (_.isEqual(_.get(error, 'code', null), 'NOT_FOUND')) {
          this.setState({
            isSubmitting: false,
            errorMessage: `There is no such flow resource with ${flowId} id.`
          });
        } else {
          this.setState({
            errorMessage: 'An unexpected error has occurred while retrieving flow resource.',
          });
        }
      });
    }
  }

  render() {
    const {errorMessage} = this.state;
    const {authState, location, branding} = this.props;

    if (errorMessage) {
      return <MessageBlock messageType={"error"} message={errorMessage}/>;
    }

    const flow = _.get(authState, 'flow', null);
    const message = _.get(authState, 'message', null);

    if (flow && (flow.isCompleted() || flow.isFailed())) {
      // Redirect to the resume endpoint
      window.location.assign(flow.resumeUrl);
      window.history.replaceState({}, '', '#done');
      return null;
    }

    if (flow) {
      const currentViewPath = STATUS_TO_COMPATIBLE_PATHS[_.get(flow, 'status',
          'unknown')];
      if (!currentViewPath) {
        return (<div>
          <Redirect to={PATH.SIGN_ON}/>
        </div>);
      }
      // Redirect to an appropriate component if all next paths do not start with the current path
      else if (!(_.some(currentViewPath,
          (path) => _.startsWith(location.pathname, path)))) {
        return (<div>
          <Redirect to={currentViewPath[0]}/>
        </div>)
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
            <Route path={PATH.FORGOT_PASSWORD_USERNAME} exact
                   render={(routeProps) =>
                       <ForgotPassword
                           {...routeProps}{...this.props}
                           flow={flow} message={message}/>}/>
            <Route path={PATH.EXPIRED} exact
                   render={(routeProps) =>
                       <PasswordEditor
                           {...routeProps}{...this.props}
                           flow={flow} message={message}
                           feedbackMessage="Your password has expired. Please create a new one."/>}/>
            <Route path={PATH.REGISTER} exact
                   render={(routeProps) =>
                       (<RegistrationForm
                           {...routeProps}{...this.props}
                           flow={flow} message={message}/>)}/>
            <Route path={PATH.VERIFY} exact
                   render={(routeProps) =>
                       <VerificationCode
                           {...routeProps}{...this.props}
                           flow={flow} message={message}/>}/>
            <Route path={PATH.RECOVERY_CODE_AND_PASSWORD} exact
                   render={(routeProps) =>
                       <RecoveryCodeAndPasswordForm
                           {...routeProps}{...this.props}
                           flow={flow} message={message}/>}/>
            <Route path={PATH.UNABLE_TO_SIGN_IN} exact
                   component={MessageBlock}/>
          </div>
        </div>
    );
  }

};

Auth.propTypes = {
  location: PropTypes.shape({}).isRequired,

  branding: PropTypes.shape({
    logo: PropTypes.string.isRequired,
  }).isRequired,

  authActions: PropTypes.shape({
    getFlow: PropTypes.func.isRequired,
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

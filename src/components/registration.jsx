import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { PATH } from './auth';
import { getServerValidatedRequirementMessage, generateRequirementsTooltip, passwordRequirementsValidator as validator } from '../sdk/helpers';
import {Flow, STATUS} from "../sdk";

class RegistrationForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      email: '',
      password: '',
      passwordVerify: '',
      redirect: null,
      errorMessage: '',
      isRegistering: false,
      passwordFocused: false,
    };

    this.handleUsernameUpdate = this.handleUsernameUpdate.bind(this);
    this.handleEmailUpdate = this.handleEmailUpdate.bind(this);
    this.handlePasswordUpdate = this.handlePasswordUpdate.bind(this);
    this.handlePasswordVerifyUpdate = this.handlePasswordVerifyUpdate.bind(this);
    this.handleSignInClick = this.handleSignInClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.showTooltipReqs = this.showTooltipReqs.bind(this);
    this.hideTooltipReqs = this.hideTooltipReqs.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    const { flow, authActions } = this.props;
    const { username, email, password } = this.state;

    const registrationLink = _.get(flow.getLinks(), ['user.register', 'href'], null);
    if (!registrationLink) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no user registration link in the flow.',
      });
      return;
    }

    this.setState({
      isRegistering: true,
    });

    return authActions.registerUser(registrationLink, username, email, password)
      .then(newFlow => {
        this.setState({
          isRegistering: false,
        });
      })
      .catch((err) => {
        this.setState({
          isRegistering: false,
        });
        const errorDetail = _.get(err, 'details[0].code', null);

        if (_.isEqual(errorDetail, STATUS.INVALID_VALUE)) {
          const errorTarget = _.get(err, 'details[0].target', null);

          if (_.isEqual(errorTarget, 'username')) {
            this.setState({
              errorMessage: 'Invalid character in username.',
            });
          } else if (_.isEqual(errorTarget, 'email')) {
            this.setState({
              errorMessage: 'Invalid email address.',
            });
          } else if (_.isEqual(errorTarget, 'password')) {
            const unsatisfiedServerRequirements = _.get(err, 'details[0].innerError.unsatisfiedRequirements', []);

            // if there are multiple server validation fails, show just one
            const failedReq = unsatisfiedServerRequirements[0];

            this.setState({
              errorMessage: getServerValidatedRequirementMessage(failedReq, flow.getPasswordPolicy()),
              password: '',
              passwordVerify: ''
            });
          } else {
            this.setState({
              errorMessage: 'An unexpected error has occurred.',
            });
          }
        } else if (_.isEqual(errorDetail, STATUS.UNIQUENESS_VIOLATION)) {
          this.setState({
            errorMessage: 'Username already taken.',
          });
        } else {
          this.setState({
            errorMessage: 'An unexpected error has occurred.',
          });
        }
      });
  }

  handleUsernameUpdate(event) {
    this.setState({
      username: event.target.value,
    });
  }

  handleEmailUpdate(event) {
    this.setState({
      email: event.target.value,
    });
  }

  handlePasswordUpdate(event) {
    this.setState({
      password: event.target.value
    });
  }

  handlePasswordVerifyUpdate(event) {
    this.setState({
      passwordVerify: event.target.value,
    });
  }

  handleSignInClick() {
    this.setState({
      redirect: (<Redirect from={PATH.REGISTER} to={PATH.SIGN_ON} />)
    });
  }

  showTooltipReqs() {
    this.setState({
      passwordFocused: true,
    });
  }

  hideTooltipReqs() {
    this.setState({
      passwordFocused: false,
    });
  }

  render() {
    const {
      username,
      email,
      password,
      passwordVerify,
      redirect,
      errorMessage,
      isRegistering,
      passwordFocused
    } = this.state;

    const { flow, message } = this.props;

    const clientValidatedRequirements = validator(flow.getPasswordPolicy(), password);
    const requirementsTooltip = generateRequirementsTooltip(clientValidatedRequirements, flow);
    const requirementsMet = !!password && _.reduce(clientValidatedRequirements, (result, req) => result && req.isValid, true);

    const doPasswordsDiffer = password !== passwordVerify;
    const isReady = !!(username && email && password && passwordVerify && !doPasswordsDiffer && requirementsMet);

    const alert = (errorMessage || message ) && (
        (errorMessage || (message && message.isError)) ? (<div className="alert alert-danger">{errorMessage ? errorMessage : message.content}</div>) :
            <div className="alert alert-info">{message.content}</div>
    );

    return isRegistering ?
        <div className="alert"> Registering...</div> :
      (
        <div>
          {redirect}
          <h1 data-id="register-heading" className="heading">Create Your Profile</h1>
            <div className="input-field">
              Enter the required information below.
            </div>
          {alert}
          <div>
            <form className="form" onSubmit={this.onSubmit}>
              <div className="input-field">
                <label>Username</label>
                <input
                    type="text"
                    className="text-input"
                    id="username"
                    name="username"
                    placeholder="Username"
                    value={username}
                    onChange={this.handleUsernameUpdate}
                    maxLength={128}
                    autoFocus
                />
              </div>
              <div className="input-field">
                <label>Email Address</label>
                <input
                    type="text"
                    className="text-input"
                    id="email"
                    name="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={this.handleEmailUpdate}
                />
              </div>
              <div className={(password && requirementsMet && !passwordFocused ? 'input-valid' : 'input-invalid' ) + ' input-field'}>
                <label>Password</label>
                <input
                    type="password"
                    className="text-input"
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={this.handlePasswordUpdate}
                    onFocus={this.showTooltipReqs}
                    onBlur={this.hideTooltipReqs}
                />
                {(clientValidatedRequirements.length > 0 && passwordFocused && !requirementsMet) && (
                    <div className="tooltip show">
                      <h4 className="heading">Minimum Password Requirements:</h4>
                      <div className="requirements">
                        {requirementsTooltip}
                      </div>
                    </div>
                )}
              </div>
              <div className={(passwordVerify && !doPasswordsDiffer ? 'input-valid' : 'input-invalid') + ' input-field'}>
                <label>Verify Password</label>
                <input
                    type="password"
                    className="text-input"
                    id="verify"
                    name="verify"
                    placeholder="Verify Password"
                    value={passwordVerify}
                    onChange={this.handlePasswordVerifyUpdate}
                />
                {doPasswordsDiffer && (
                    <div className="tooltip show">
                      <i className="fa fa-warning" style={{color:'red'}}></i>
                      <span className="requirement__name">Passwords don’t match. Please try again.</span>
                    </div>
                )}
              </div>
              <button
                  data-id="register-button"
                  className="button"
                  onClick={this.handleSubmit}
                  type="submit"
                  disabled={!isReady}>
                Save
              </button>
            </form>
          </div>
          <div className="input-field">
              Already have an account? <a data-id="signInBtn" href="#" onClick={this.handleSignInClick}>Sign in</a>
            </div>
        </div>
      );
  }
}

RegistrationForm.propTypes = {
  flow: PropTypes.instanceOf(Flow).isRequired,
  authActions: PropTypes.shape({
    updateFlow: PropTypes.func.isRequired,
  }).isRequired,
};

export default RegistrationForm;

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Flow } from '../sdk/index';
import { passwordRequirementsValidator, getServerValidatedRequirementMessage, generateRequirementsTooltip } from '../sdk/helpers';
import {Redirect} from "react-router";
import {PATH} from "./auth";

class RecoveryCodeAndPasswordForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recoveryCode: '',
      newPassword: '',
      newPasswordVerify: '',
      feedbackMessage: 'If you have an active account with a valid email address, you will receive ' +
      'an email with a recovery code which you may enter here, along with a new password. If you do ' +
      'not have an account or email, please contact your administrator to recover your password.',
      errorMessage: '',
      isSubmitting: false,
      isResending: false,
      newPasswordFocused: false,
      redirect: null
    };

    this.handleRecoveryCodeUpdate = this.handleRecoveryCodeUpdate.bind(this);
    this.handleNewPasswordUpdate = this.handleNewPasswordUpdate.bind(this);
    this.handleNewPasswordVerifyUpdate = this.handleNewPasswordVerifyUpdate.bind(this);
    this.handleResend = this.handleResend.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.showTooltipReqs = this.showTooltipReqs.bind(this);
    this.hideTooltipReqs = this.hideTooltipReqs.bind(this);
  }

  handleRecoveryCodeUpdate(event) {
    this.setState({recoveryCode: event.target.value});
  }

  handleNewPasswordUpdate(event) {
    this.setState({
      newPassword: event.target.value
    });
  }

  handleNewPasswordVerifyUpdate(event) {
    this.setState({newPasswordVerify: event.target.value});
  }

  handleResend() {
    const {
      flow,
      authActions,
    } = this.props;

    const sendRecoveryCodeUrl = _.get(flow.getLinks(), ['password.sendRecoveryCode', 'href'], null);
    if (!sendRecoveryCodeUrl) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no send recovery code link in the flow.',
      });
      return;
    }

    this.setState({isResending: true});
    return authActions.sendRecoveryCode(sendRecoveryCodeUrl)
      .then((newLoginFlow) => {
        const updatedFlow = new Flow(newLoginFlow);
        if (updatedFlow.isRecoveryCodeRequired()) {
          this.setState({
            feedbackMessage: 'Recovery code resent. If an email address is associated with your account, ' +
              'you will receive an email with a recovery code which you may enter here, along with a new password. ' +
              'If you do not have an account or email, please contact your administrator to recover your password.',
            recoveryCode: '',
            newPassword: '',
            newPasswordVerify: '',
            errorMessage: '',
            isResending: false,
          });
          return Promise.resolve();
        }
        return Promise.reject(new Error('Could not understand flow'));
      })
      .catch((err) => {
        this.setState({
          feedbackMessage: 'Enter recovery code once received, along with a new password.',
          errorMessage: 'Unable to resend recovery code. Please try again.',
          isResending: false,
        });
      });
  }

  handleCancel(event) {
    event.preventDefault();

    const {
      authActions
    } = this.props;

    this.setState({
      redirect: (<Redirect from={PATH.RECOVERY_CODE_AND_PASSWORD} to={PATH.SIGN_ON} />),
      isSubmitting: false,
      isResending: false
    });

    // Reset flow to start the process again
    authActions.updateFlow(null);
  }

  handleSubmit(event) {
    event.preventDefault();
    const {recoveryCode, newPasswordVerify, newPassword} = this.state;
    const {
      flow,
      authActions,
    } = this.props;

    const recoverPasswordUrl = _.get(flow.getLinks(), ['password.recover', 'href'], null);
    if (!recoverPasswordUrl) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no password recovery link in the flow.',
      });
      return;
    }

    if (newPasswordVerify !== newPassword) {
      this.setState({ errorMessage: 'New passwords don’t match. Please try again.' });
      return Promise.reject();
    }

    if (recoverPasswordUrl === null) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no password recovery link in the flow.',
      });
      return;
    }

    return new Promise(resolved => this.setState({isSubmitting: true}, () => resolved()))
    .then(() => authActions.recoverUserPassword(recoverPasswordUrl, recoveryCode, newPassword))
    .then(newFlow => {
      this.setState({
        isSubmitting: false
      });
    })
    .catch((err) => {
      const errorDetail = _.get(err, 'details[0].code', null);

        if (_.isEqual(errorDetail, 'INVALID_VALUE')) {
          const errorTarget = _.get(err, 'details[0].target', null);

          if (_.isEqual(errorTarget, 'recoveryCode')) {
            this.setState({
              recoveryCode: '',
              newPassword: '',
              newPasswordVerify: '',
              errorMessage: 'Incorrect recovery code. Please try again.',
              isSubmitting: false
            });
          } else if (_.isEqual(errorTarget, 'newPassword')) {
            const unsatisfiedServerRequirements = _.get(err, 'details[0].innerError.unsatisfiedRequirements', []);

            // if there are multiple server validation fails, show just one
            const failedReq = unsatisfiedServerRequirements[0];

            this.setState({
              newPassword: '',
              newPasswordVerify: '',
              errorMessage: getServerValidatedRequirementMessage(failedReq, flow.getPasswordPolicy()),
              feedbackMessage: 'Please try again to set a new password with existed recovery code',
              isSubmitting: false
            });
          } else {
            // Edge case where the error detail is INVALID_VALUE, but it's not a value we expect. Should never happen unless an API change happens without updating the UI.
            this.setState({
              errorMessage: 'An unexpected error has occurred.',
              isSubmitting: false
            });
          }
        } else {
          // Edge case where the error detail not INVALID_VALUE. Should never happen unless an API change happens without updating the UI.
          this.setState({
            errorMessage: 'An unexpected error has occurred.',
            isSubmitting: false
          });
        }
      })
  }

  showTooltipReqs() {
    this.setState({
      newPasswordFocused: true,
    });
  }

  hideTooltipReqs() {
    this.setState({
      newPasswordFocused: false,
    });
  }

  render() {
    const {
      recoveryCode,
      newPassword,
      newPasswordVerify,
      feedbackMessage,
      errorMessage,
      redirect,
      newPasswordFocused,
      isResending,
      isSubmitting,
    } = this.state;

    const {flow, message} = this.props;

    const clientValidatedRequirements = passwordRequirementsValidator(flow.getPasswordPolicy(), newPassword);
    const requirementsMet = !!newPassword && _.reduce(clientValidatedRequirements, (result, req) => result && req.isValid, true);
    const requirementsTooltip = generateRequirementsTooltip(clientValidatedRequirements, flow);

    const alert = (errorMessage || message ) && (
        (errorMessage || (message && message.isError)) ? (<div className="alert alert-danger">{errorMessage ? errorMessage : message.content}</div>) :
            <div className="alert alert-success">{message.content}</div>
    );
    const doPasswordsDiffer = newPassword && newPasswordVerify && !_.isEqual(newPassword, newPasswordVerify);

    const spinnerMessage = () => {
      if (isSubmitting) {
        return 'Processing recovery request...'
      } else if (isResending) {
        return 'Processing resending recovery request...'
      }
    };

    return isSubmitting || isResending ?
        <div className="alert alert-info">
          {spinnerMessage}
          <span className="loader"></span>
        </div>:
      (
        <div>
          {redirect}
          <h1 className="heading" data-id="recovery-heading">Enter New Password</h1>
          <div className="alert alert-info">{feedbackMessage}</div>
          {alert}
          <form className="form">
            <div className="input-field">
              <label>Recovery Code</label>
              <input
                type="password"
                className="text-input"
                id="recovery-code"
                name="recovery-code"
                placeholder="Recovery Code"
                value={recoveryCode}
                onChange={this.handleRecoveryCodeUpdate}
              />
            </div>
            <div className = {(!!newPassword && !requirementsMet && !newPasswordFocused ? 'input-invalid' : 'input-valid' ) + ' input-field'}>
              <label>New Password</label>
              <input
                type="password"
                className="text-input"
                id="new"
                name="new"
                placeholder="New Password"
                value={newPassword}
                onChange={this.handleNewPasswordUpdate}
                onFocus={this.showTooltipReqs}
                onBlur={this.hideTooltipReqs}
              />
              {(clientValidatedRequirements.length > 0 && newPasswordFocused && !requirementsMet) && (
                <div className="tooltip show">
                  <h4 className="heading">Minimum Password Requirements:</h4>
                  <div className="requirements">
                    {requirementsTooltip}
                  </div>
                </div>
              )}
            </div>
            <div className={(!!newPasswordVerify && !doPasswordsDiffer ? 'input-valid': 'input-invalid') + ' input-field'}>
              <label>Verify New Password</label>
              <input
                type="password"
                className="text-input"
                id="verify"
                name="verify"
                placeholder="Verify New Password"
                value={newPasswordVerify}
                onChange={this.handleNewPasswordVerifyUpdate}
              />
              {doPasswordsDiffer && (
                  <div className="tooltip show">
                    <i className="fa fa-warning" style={{color:'red'}}></i>
                    <span className="requirement__name">Passwords don’t match. Please try again.</span>
                  </div>
              )}
            </div>
            <div className="input-field">
              <button
                  id="save"
                  className="button"
                  onClick={this.handleSubmit}
                  disabled={!recoveryCode || !newPassword || !newPasswordVerify || doPasswordsDiffer || !requirementsMet}
                  type="submit">
                Save
              </button>
            </div>
            <div className="input-field">
              <button
                  className="button"
                  data-id="cancel-btn"
                  onClick={this.handleCancel}>
                Cancel
              </button>
            </div>
          </form>
          <div className="input-field">
            Didn’t receive an email? <a data-id="resend-email" href="#" onClick={this.handleResend}>Resend</a>
          </div>
        </div>
      );
  }
}

RecoveryCodeAndPasswordForm.propTypes = {
  flow: PropTypes.instanceOf(Flow).isRequired,
  authActions: PropTypes.shape({
    sendRecoveryCode: PropTypes.func.isRequired,
    recoverUserPassword: PropTypes.func.isRequired,
    updateFlow: PropTypes.func.isRequired,
  }).isRequired
};

export default RecoveryCodeAndPasswordForm;

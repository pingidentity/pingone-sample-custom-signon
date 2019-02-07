import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Flow } from '../sdk/index';
import { passwordRequirementsValidator as validator, getServerValidatedRequirementMessage, generateRequirementsTooltip } from '../sdk/passwordRequirementsValidation';
import {Redirect} from "react-router";
import {PATH} from "./app";

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
      clientValidatedRequirements: validator(props.flow.getPasswordPolicy(), ''),
      requirementsMet: false,
      redirect: null,
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
    this.setState({ recoveryCode: event.target.value });
  }

  handleNewPasswordUpdate(event) {
    const { flow } = this.props;
    const errors = validator(flow.getPasswordPolicy(), event.target.value);
    this.setState({
      newPassword: event.target.value,
      clientValidatedRequirements: errors,
      requirementsMet: !!event.target.value && _.reduce(errors, (result, req) => result && req.isValid, true),
    });
  }

  handleNewPasswordVerifyUpdate(event) {
    this.setState({ newPasswordVerify: event.target.value });
  }

  handleResend() {
    const {
      flow,
      userActions,
    } = this.props;
    const sendRecoveryCodeObject = _.get(flow.getLinks(), 'password.sendRecoveryCode', null);
    const sendRecoveryCodeUrl = _.get(sendRecoveryCodeObject, 'href', null);
    this.setState({ isResending: true });
    return userActions.sendRecoveryCode(sendRecoveryCodeUrl)
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
            clientValidatedRequirements: validator(flow.getPasswordPolicy(), ''),
            requirementsMet: false,
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
        return Promise.resolve(err);
      });
  }

  handleCancel(event) {
    event.preventDefault();
    this.setState({
      redirect: <Redirect to={PATH.FORGOT_PASSWORD_USERNAME} />,
      isSubmitting: false,
    });
    return Promise.resolve();
  }

  handleSubmit(event) {
    event.preventDefault();
    const { recoveryCode, newPasswordVerify, newPassword } = this.state;
    const {
      flow,
      userActions,
    } = this.props;

    const recoverPasswordObject = _.get(flow.getLinks(), 'password.recover', null);
    const recoverPasswordUrl = _.get(recoverPasswordObject, 'href', null);

    if (newPasswordVerify !== newPassword) {
      // Should never hit this but it doesn't hurt anything to keep it here
      this.setState({ errorMessage: 'New passwords don’t match. Please try again.' });
      return Promise.reject();
    }

    if (recoverPasswordUrl === null) {
      return userActions.unrecoverableError(new Error('An unexpected error has occurred'));
    }

    return new Promise((resolved) => this.setState({ isSubmitting: true }, () => resolved()))
      .then(() => userActions.recoverUserPassword(recoverPasswordUrl, recoveryCode, newPassword))
      .then((newloginFlow) => {
        this.setState({
          isSubmitting: false,
        });

        userActions.updateFlow(newloginFlow);
        return Promise.resolve();
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
              clientValidatedRequirements: validator(flow.getPasswordPolicy(), ''),
              requirementsMet: false,
            });
          } else if (_.isEqual(errorTarget, 'newPassword')) {
            const unsatisfiedServerRequirements = _.get(err, 'details[0].innerError.unsatisfiedRequirements', []);

            // if there are multiple server validation fails, show just one
            const failedReq = unsatisfiedServerRequirements[0];

            this.setState({
              recoveryCode: '',
              newPassword: '',
              newPasswordVerify: '',
              errorMessage: getServerValidatedRequirementMessage(failedReq, flow.getPasswordPolicy()),
              clientValidatedRequirements: validator(flow.getPasswordPolicy(), ''),
              requirementsMet: false,
            });
          } else {
            // Edge case where the error detail is INVALID_VALUE, but it's not a value we expect. Should never happen unless an API change happens without updating the UI.
            this.setState({
              errorMessage: 'An unexpected error has occurred.',
            });
          }
        } else {
          // Edge case where the error detail not INVALID_VALUE. Should never happen unless an API change happens without updating the UI.
          this.setState({
            errorMessage: 'An unexpected error has occurred.',
          });
        }

        return Promise.resolve(err);
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
      isSubmitting,
      clientValidatedRequirements,
      requirementsMet,
      redirect,
      newPasswordFocused,
      isResending,
    } = this.state;

    const { flow } = this.props;

    const requirementsTooltip = generateRequirementsTooltip(clientValidatedRequirements, flow);

    const errorAlert = errorMessage ?
      (
        <div className="alert alert-danger">
        {errorMessage}
        </div>
      ) :
      null;

    const doPasswordsDiffer = newPassword && newPasswordVerify && !_.isEqual(newPassword, newPasswordVerify);

    const spinnerMessage = isResending ? 'Processing recovery request...' : 'Signing you on...';

    return isSubmitting || isResending ?
        <div className="alert-info">
          {spinnerMessage}
          <span className="loader"></span>
        </div>:
      (
        <div>
          {redirect}
          <h1 className="heading" data-id="recovery-heading">Enter New Password</h1>
          <div className="alert alert-info">{feedbackMessage}</div>
          {errorAlert}
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
                  <h4 className="heading heading--4">Minimum Password Requirements:</h4>
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
            </div>
            <div className="input-field">
              <button
                  id="save"
                  className="button button--primary brand-primary-bg"
                  onClick={this.handleSubmit}
                  disabled={!recoveryCode || !newPassword || !newPasswordVerify || doPasswordsDiffer || !requirementsMet}
                  type="submit"
              >
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
  userActions: PropTypes.shape({
    sendRecoveryCode: PropTypes.func.isRequired,
    recoverUserPassword: PropTypes.func.isRequired,
  }).isRequired
};

export default RecoveryCodeAndPasswordForm;

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { PATH } from './app';
import { Flow } from '../sdk/index';

import { passwordRequirementsValidator as validator, getServerValidatedRequirementMessage, generateRequirementsTooltip } from '../sdk/passwordRequirementsValidation';

class PasswordEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPassword: '',
      newPassword: '',
      newPasswordVerify: '',
      errorMessage: '',
      isValidatingCredentials: false,
      saveAttempted: false,
      newPasswordFocused: false,
      clientValidatedRequirements: validator(props.flow.getPasswordPolicy(), ''),
      requirementsMet: false,
      redirect: null,
    };

    this.handleCurrentPasswordUpdate = this.handleCurrentPasswordUpdate.bind(this);
    this.handleNewPasswordUpdate = this.handleNewPasswordUpdate.bind(this);
    this.handleNewPasswordVerifyUpdate = this.handleNewPasswordVerifyUpdate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.showTooltipReqs = this.showTooltipReqs.bind(this);
    this.hideTooltipReqs = this.hideTooltipReqs.bind(this);
  }

  handleCurrentPasswordUpdate(event) {
    this.setState({ currentPassword: event.target.value });
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

  handleSubmit(event) {
    event.preventDefault();
    const { currentPassword, newPasswordVerify, newPassword } = this.state;
    const { flow, userActions } = this.props;

    const changePasswordObject = _.get(flow.getLinks(), 'password.reset', null);
    const changePasswordUrl = _.get(changePasswordObject, 'href', null);

    this.setState({
      saveAttempted: true,
    });

    if (newPasswordVerify !== newPassword) {
      // Should never hit this but it doesn't hurt anything to keep it here
      const errorMessage = 'New passwords don’t match. Please try again.';
      this.setState({ errorMessage });
      return Promise.reject(new Error(errorMessage));
    }

    if (changePasswordUrl === null) {
      return userActions.unrecoverableError(new Error('An unexpected error has occurred'));
    }

    //  Initiate an action to change (or reset) the user’s password.
    return new Promise((resolved) => this.setState({ isValidatingCredentials: true }, () => resolved()))
      .then(() => userActions.changeUserPassword(changePasswordUrl, currentPassword, newPassword))
      .catch((err) => {
        const errorDetail = _.get(err, 'details[0].code', null);

        if (_.isEqual(errorDetail, 'INVALID_VALUE')) {
          const errorTarget = _.get(err, 'details[0].target', null);

          if (_.isEqual(errorTarget, 'currentPassword')) {
            this.setState({
              currentPassword: '',
              newPassword: '',
              newPasswordVerify: '',
              clientValidatedRequirements: validator(flow.getPasswordPolicy(), ''),
              errorMessage: 'Incorrect current password. Please try again.',
              requirementsMet: false,
            });
          } else if (_.isEqual(errorTarget, 'newPassword')) {
            const unsatisfiedServerRequirements = _.get(err, 'details[0].innerError.unsatisfiedRequirements', []);

            // if there are multiple server validation fails, show just one
            const failedReq = unsatisfiedServerRequirements[0];

            this.setState({
              currentPassword: '',
              newPassword: '',
              newPasswordVerify: '',
              clientValidatedRequirements: validator(flow.getPasswordPolicy(), ''),
              errorMessage: getServerValidatedRequirementMessage(failedReq, flow.getPasswordPolicy()),
              requirementsMet: false,
            });
          } else {
            // Edge case where the error detail is INVALID_VALUE, but it's not a value we expect. Should never happen unless an API change happens without updating the UI.
            this.setState({
              errorMessage: 'An unexpected error has occurred.',
            });
          }
        } else if (_.isEqual(errorDetail, 'PASSWORD_LOCKED_OUT')) {
          this.setState({
            redirect: (<Redirect
              from={PATH.CHANGE_PASSWORD}
              to={{
                pathname: PATH.UNABLE_TO_SIGN_IN,
                state: { errorMessage: 'Too many unsuccessful sign-on attempts. Account is now locked.' },
              }}
            />),
          });
        } else {
          // Edge case where the error detail not one of the expected values. Should never happen unless an API change happens without updating the UI.
          this.setState({
            errorMessage: 'An unexpected error has occurred.',
          });
        }

        return Promise.resolve(err);
      })
      .then(() => this.setState({ isValidatingCredentials: false }));
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
      currentPassword,
      newPassword,
      newPasswordVerify,
      errorMessage,
      isValidatingCredentials,
      clientValidatedRequirements,
      requirementsMet,
      redirect,
      saveAttempted,
      newPasswordFocused,
    } = this.state;

    const { flow, feedbackMessage } = this.props;

    const requirementsTooltip = generateRequirementsTooltip(clientValidatedRequirements, flow);

    const errorAlert = errorMessage ?
      (
        <div className="alert alert-danger">
        {errorMessage}
        </div>
      ) :
      null;

    const doPasswordsDiffer = newPassword && newPasswordVerify && !_.isEqual(newPassword, newPasswordVerify);

    return isValidatingCredentials ?
      <div className="alert"> Waiting </div> :
      (
        <div>
          {redirect}
          <h1 className="heading">Change Password</h1>
            <div className="alert alert-info">{feedbackMessage}</div>
          {errorAlert}
          <form className="form" onSubmit={this.handleSubmit}>
            <div className="input-field">
              <label>Current Password</label>
              <input
                type="password"
                className="text-input"
                id="password"
                name="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={this.handleCurrentPasswordUpdate}
              />
            </div>
            <div className={(!!newPassword && !requirementsMet && !newPasswordFocused )? ' input-field input-invalid' : ' input-field input-valid'}>
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
                autoFocus={saveAttempted}
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
            <div className={(!!newPassword && !doPasswordsDiffer )? ' input-field input-valid' : ' input-field input-invalid'}>
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
            <button
              className="button button--primary brand-primary-bg"
              disabled={!currentPassword || !newPassword || !newPasswordVerify || doPasswordsDiffer || !requirementsMet}
              type="submit"
            >
              Save
            </button>
          </form>
        </div>
      );
  }
}

PasswordEditor.propTypes = {
  flow: PropTypes.instanceOf(Flow).isRequired,
  userActions: PropTypes.shape({
    changeUserPassword: PropTypes.func.isRequired,
  }).isRequired,
  feedbackMessage: PropTypes.string.isRequired
};

export default PasswordEditor;

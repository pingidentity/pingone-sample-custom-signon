import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {Flow} from "../sdk";
import {Redirect} from "react-router";
import {PATH} from "./app";

class VerificationCode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      verificationCode: '',
      isVerifying: false,
      errorMessage: '',
      isResending: false,
      redirect: null
    };

    this.handleResendEmail = this.handleResendEmail.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVerificationCodeUpdate = this.handleVerificationCodeUpdate.bind(this);
  }

  handleVerificationCodeUpdate(event) {
    this.setState({
      verificationCode: event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const {
      flow,
      userActions,
    } = this.props;
    const { verificationCode } = this.state;
    this.setState({
      isVerifying: true,
    });

    const verifyLink = _.get(flow.getLinks()['user.verify'], 'href', null);

    if (!verifyLink) {
      return userActions.unrecoverableError(new Error('An unexpected error has occurred'));
    }

    return userActions.verifyUser(verifyLink, verificationCode)
      .then((newloginFlow) => {
        this.setState({
          isVerifying: false,
        });

        userActions.updateFlow(newloginFlow);
        return Promise.resolve();
      })
      .catch((err) => {
        this.setState({ isVerifying: false });

        const errorDetail = _.get(err, 'details[0].code', null);
        if (_.isEqual(errorDetail, 'INVALID_VALUE')) {
          const errorTarget = _.get(err, 'details[0].target', null);
          if (errorTarget === 'verificationCode') {
            this.setState({
              errorMessage: 'Incorrect verification code. Please try again.',
              verificationCode: '',
            });

            return Promise.resolve(err);
          }
        }

        this.setState({
          errorMessage: 'An unexpected error occurred. Please try again.',
          verificationCode: '',
        });

        return Promise.reject(err);
      });
  }


  handleCancel(event) {
    event.preventDefault();
    this.setState({
      redirect: <Redirect to={PATH.FORGOT_PASSWORD_USERNAME} />,
      isVerifying: false,
    });
    return Promise.resolve();
  }

  handleResendEmail() {
    const { flow, userActions } = this.props;
    const sendVerificationCodeHref = _.get(flow.getLinks()['user.sendVerificationCode'], 'href', null);

    if (!sendVerificationCodeHref) {
      return userActions.unrecoverableError(new Error('An unexpected error has occurred'));
    }

    this.setState({ isResending: true });

    return userActions.sendVerificationCode(sendVerificationCodeHref)
      .then((newloginFlow) => {
        this.setState({ errorMessage: '', isResending: false });
        Promise.resolve(newloginFlow);
      })
      .catch((err) => {
        this.setState({
          errorMessage: 'Something went wrong when trying to resend a verification code.',
          isResending: false,
        });
        return Promise.reject(err);
      });
  }

  render() {
    const { verificationCode, isVerifying, errorMessage, isResending, redirect  } = this.state;

    const isReady = !!verificationCode;

    const errorAlert = errorMessage && (
      <div className="alert alert-danger">{errorMessage}</div>
    );

    const spinnerMessage = isResending ? 'Resending verification code...' : 'Verifying...';

    return isVerifying || isResending ?
        <div className="alert-info">
          {spinnerMessage}
          <span className="loader"></span>
        </div> :
      (
        <div>
          {redirect}
          <h1 className="heading" data-id="verification-heading">Thank You!</h1>
          {errorAlert}
          <div className="input-field">
              <p>
              We&#39;ve sent a verification email to your email address.
              Please verify your email to finish setting up your PingOne account.
              </p>

              <form className="form" onSubmit={this.onSubmit}>
                <div className="input-field">
                  <label>Verification Code</label>
                  <input
                    type="password"
                    className="text-input"
                    id="verification-code"
                    name="verification-code"
                    placeholder="Verification Code"
                    value={verificationCode}
                    onChange={this.handleVerificationCodeUpdate}
                  />
                </div>
                <div className="input-field">
                  <button
                      data-id="verify-button"
                      className="button button--primary brand-primary-bg"
                      onClick={this.handleSubmit}
                      type="submit"
                      disabled={!isReady}>
                    Verify
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
          </div>
          <div className="input-field">
              Didn’t receive an email? <a data-id="resend-email" href="#" onClick={this.handleResendEmail}>Resend</a>
            </div>
        </div>
      );
  }
}

VerificationCode.propTypes = {
  flow: PropTypes.instanceOf(Flow).isRequired,
  userActions: PropTypes.shape({
    updateFlow: PropTypes.func.isRequired,
    sendVerificationCode: PropTypes.func.isRequired,
    verifyUser: PropTypes.func.isRequired,
  }).isRequired,
};

export default VerificationCode;

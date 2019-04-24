import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {Flow, STATUS} from "../sdk";

class VerificationCode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      verificationCode: '',
      isVerifying: false,
      errorMessage: '',
      isResending: false
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
      authActions,
    } = this.props;
    const { verificationCode } = this.state;
    this.setState({
      isVerifying: true,
    });

    const verifyLink = _.get(flow.getLinks()['user.verify'], 'href', null);
    if (!verifyLink) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no user verification link in the flow.',
      });
      return;
    }

    return authActions.verifyUser(verifyLink, verificationCode)
      .then(newFlow => {
        this.setState({
          isVerifying: false,
        });
      })
      .catch((err) => {
        this.setState({ isVerifying: false });

        const errorDetail = _.get(err, 'details[0].code', null);
        if (_.isEqual(errorDetail, STATUS.INVALID_VALUE)) {
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
      });
  }

  handleResendEmail() {
    const { flow, authActions } = this.props;

    const sendVerificationCodeHref = _.get(flow.getLinks()['user.sendVerificationCode'], 'href', null);
    if (!sendVerificationCodeHref) {
      this.setState({
        errorMessage: 'An unexpected error has occurred. There is no send verification code link in the flow.',
      });
      return;
    }

    this.setState({ isResending: true });

    return authActions.sendVerificationCode(sendVerificationCodeHref)
      .then((newFlow) => {
        this.setState({ errorMessage: '', isResending: false });
        Promise.resolve(newFlow);
      })
      .catch((err) => {
        this.setState({
          errorMessage: 'Something went wrong when trying to resend a verification code.',
          isResending: false,
        });
      });
  }

  render() {
    const { verificationCode, isVerifying, errorMessage, isResending  } = this.state;
    const { message } = this.props;

    const isReady = !!verificationCode;

    const alert = (errorMessage || message ) && (
        (errorMessage || (message && message.isError)) ? (<div className="alert alert-danger">{errorMessage ? errorMessage : message.content}</div>) :
            <div className="alert alert-success">{message.content}</div>
    );

    const spinnerMessage = isResending ? 'Resending verification code...' : 'Verifying...';

    return isVerifying || isResending ?
        <div className="alert alert-info">
          {spinnerMessage}
          <span className="loader"></span>
        </div> :
      (
        <div>
          <h1 className="heading" data-id="verification-heading">Thank You!</h1>
          {alert}
          <div className="input-field">
              <div className="alert alert-info">
              We&#39;ve sent a verification email to your email address.
              Please verify your email to finish setting up your PingOne account.
              </div>

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
                      className="button"
                      onClick={this.handleSubmit}
                      type="submit"
                      disabled={!isReady}>
                    Verify
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
  authActions: PropTypes.shape({
    updateFlow: PropTypes.func.isRequired,
    sendVerificationCode: PropTypes.func.isRequired,
    verifyUser: PropTypes.func.isRequired,
  }).isRequired,
};

export default VerificationCode;

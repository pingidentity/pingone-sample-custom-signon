import React from 'react';
import PropTypes from 'prop-types';
import {Redirect} from 'react-router';
import UsernameValidator from './usernameValidator';
import {PATH} from './auth';
import _ from "lodash";
import {Flow} from "../sdk";

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSubmitting: false,
      redirect: null
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  handleSubmit(username) {
    const {
      flow,
      authActions
    } = this.props;

    this.setState({
      isSubmitting: true,
      spinnerMessage: 'Processing password recovery request...'
    });

    const forgotPasswordUrl = _.get(flow.getLinks(), ['password.forgot', 'href'], null);
    if (!forgotPasswordUrl) {
      this.setState({
        errorMessage: 'There is no forgot password link in the flow. Your password policy may have disabled password recovery. Please check your application configuration in PingOne for Customers Admin Console. ',
      });
      return;
    }

    return authActions.forgotPassword(forgotPasswordUrl, username)
    .catch(error => {
      if (_.isEqual(_.get(error, 'code', null), 'NOT_FOUND')) {
        this.setState({
          isSubmitting: false,
          errorMessage: 'Such user name could not be found. Please try again.'
        });
      } else {
        this.setState({
          errorMessage: 'An unexpected error has occurred while processing password recovery request.',
        });
      }
    });
  }

  handleCancel() {
    this.setState({
      redirect: (
          <Redirect from={PATH.FORGOT_PASSWORD_USERNAME} to={PATH.SIGN_ON}/>),
      isSubmitting: false
    });
  }

  render() {
    const {
      isSubmitting,
      spinnerMessage,
      errorMessage,
      redirect,
      username,
    } = this.state;
    const {message} = this.props;

    const alert = (errorMessage || message) && (
        (errorMessage || (message && message.isError)) ? (
                <div className="alert alert-danger">{errorMessage ? errorMessage
                    : message.content}</div>) :
            <div className="alert alert-info">{message.content}</div>
    );

    const validator = (
        <UsernameValidator
            username={username}
            handleSubmit={this.handleSubmit}
            handleCancel={this.handleCancel}
        >
          {alert}
        </UsernameValidator>
    );

    return isSubmitting ?
        <div className="alert alert-info">
          {spinnerMessage}
          <span className="loader"></span>
        </div> : (
            <div>
              {redirect}
              {validator}
            </div>
        );
  }
}

ForgotPassword.propTypes = {
  flow: PropTypes.instanceOf(Flow).isRequired,
  authActions: PropTypes.shape({
    forgotPassword: PropTypes.func.isRequired,
  }).isRequired,
};

export default ForgotPassword;

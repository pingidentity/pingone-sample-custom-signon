import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import UsernameValidator from './usernameValidator';
import { PATH } from './app';
import _ from "lodash";
import {Flow} from "../sdk";

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSubmitting: false,
      redirect: null,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  handleSubmit(username) {
    const {
      flow,
      userActions
    } = this.props;

    this.setState({
      isSubmitting: true,
      spinnerMessage: 'Processing password recovery request...'
    });

    const forgotPasswordObject = _.get(flow.getLinks(), 'password.forgot', null);
    const forgotPasswordUrl = _.get(forgotPasswordObject, 'href', null);

    return userActions.forgotPassword(forgotPasswordUrl, username)
    .then((newloginFlow) => {
      userActions.updateFlow(newloginFlow);
      return Promise.resolve(newloginFlow);
    })
    .catch((error) => {
      if (_.isEqual(_.get(error, 'code', null), 'NOT_FOUND')) {
        this.setState({
          isSubmitting: false ,
          message: { isError: true, content : 'Such user name could not be found. Please try again.' }
        });

      } else {
        this.setState({
          isSubmitting: false ,
          message: { isError: true, content : error.message }
        });
      }
      return Promise.reject(error);

    });
  }

  handleCancel() {
    this.setState({
      redirect: <Redirect from={PATH.FORGOT_PASSWORD_USERNAME} to={PATH.SING_ON} />,
      isSubmitting: false,
    });
    return Promise.resolve();
  }

  render() {
    const {
      isSubmitting,
      spinnerMessage,
      redirect,
      username,
    } = this.state;
    const { message } = this.props;

    const errorAlert = message && message.isError
        ? (
            <div className="input-field">
              <div className="alert alert-danger">{message.content}</div>
            </div>
        )
        : null;

    const validator = (
      <UsernameValidator
        username={username}
        handleSubmit={this.handleSubmit}
        handleCancel={this.handleCancel}
      >
        {errorAlert}
      </UsernameValidator>
    );

    return isSubmitting ?
        <div className="alert-info">
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
  userActions: PropTypes.shape({
    forgotPassword: PropTypes.func.isRequired,
  }).isRequired,
};

export default ForgotPassword;

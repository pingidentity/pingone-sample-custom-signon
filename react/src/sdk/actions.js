import {Flow} from '../sdk/index';
import api from './api';
import _ from "lodash";

const types = {
  UPDATE_FLOW: 'UPDATE_FLOW',
  UNRECOVERABLE_ERROR: 'UNRECOVERABLE_ERROR'
};

// Actions Creator

const updateFlowAction = (result, isAuthenticated = false, message = null) => ({
  type: types.UPDATE_FLOW,
  payload: {
    result,
    isAuthenticated,
    message
  }
});

const updateFlow = (dispatch) => (result = null, isAuthenticated = false, message = null) => {
  return dispatch(updateFlowAction(result ? new Flow(result): result, isAuthenticated, message));
};

const getFlow = (dispatch) => (environmentId, flowId) => {
  return api.getFlow(environmentId, flowId)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const resetFlow = (dispatch) => (apiPath) => {
  return api.resetFlow(apiPath)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const signOn = (dispatch) => (apiPath, username, password) => {
  return api.signOn(apiPath, username, password)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow), true));
    return Promise.resolve(flow);
  })
};

const forgotPassword = (dispatch) => (apiPath, username) => {
  return api.forgotPassword(apiPath, username)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const sendRecoveryCode = (dispatch) => (apiPath) => {
  return api.sendRecoveryCode(apiPath)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const recoverUserPassword = (dispatch) => (apiPath, recoveryCode,
    newPassword) => {
  return api.recoverUserPassword(apiPath, recoveryCode,
      newPassword)
  .then(flow => {
    dispatch(updateFlowAction(new Flow(flow), false, 'You successfully recovered your password, ' + _.get(flow, '_embedded.user.username', '')));
    return Promise.resolve(flow);
  })
};

const changeUserPassword = (dispatch) => (apiPath, username, currentPassword,
    newPassword) => {
  return api.changeUserPassword(apiPath, username, currentPassword,
      newPassword)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const sendVerificationCode = (dispatch) => (apiPath) => {
  return api.sendVerificationCode(apiPath)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

const verifyUser = (dispatch) => (apiPath, verificationCode) => {
  return api.verifyUser(apiPath, verificationCode)
  .then(flow => {
    dispatch(updateFlowAction(new Flow(flow), false, 'Congratulations, '+ _.get(flow, '_embedded.user.username') + '! You’ve created a Ping Sample Application account'));
    return Promise.resolve(flow);
  })
};

const registerUser = (dispatch) => (apiPath, username, email, password) => {
  return api.registerUser(apiPath, username, email, password)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
};

export default {
  types,

  bind: (dispatch) => ({
    signOn: signOn(dispatch),
    changeUserPassword: changeUserPassword(dispatch),
    forgotPassword: forgotPassword(dispatch),
    sendRecoveryCode: sendRecoveryCode(dispatch),
    recoverUserPassword: recoverUserPassword(dispatch),
    sendVerificationCode: sendVerificationCode(dispatch),
    verifyUser: verifyUser(dispatch),
    registerUser: registerUser(dispatch),

    getFlow: getFlow(dispatch),
    updateFlow: updateFlow(dispatch),
    resetFlow: resetFlow(dispatch)
  })
};

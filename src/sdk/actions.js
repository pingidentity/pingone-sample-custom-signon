import {Flow} from '../sdk/index';
import api from './api';

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

const throwError = (error) => ({
      type: types.UNRECOVERABLE_ERROR,
      payload: {
        error: error
      }
    }
);

const updateFlow = (dispatch) => (result = null, isAuthenticated = false, message = null) => {
  return dispatch(updateFlowAction(result ? new Flow(result): result, isAuthenticated, message));
}

const resetFlow = (dispatch) => (apiPath) => {
  return api.resetFlow(apiPath)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
  .catch((error) => {
    dispatch(throwError(error));
  })
}

const authorize = (dispatch) => (environmentId, responseType, clientId,
    redirectUri, scope, state) => {

  return api.authorize(environmentId, responseType, clientId, redirectUri,
      scope, state)
  .then(flow => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
  .catch(error => {
    dispatch(throwError(error));
  });
}

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
}

const sendRecoveryCode = (dispatch) => (apiPath) => {
  return api.sendRecoveryCode(apiPath)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
}

const recoverUserPassword = (dispatch) => (apiPath, recoveryCode,
    newPassword) => {
  return api.recoverUserPassword(apiPath, recoveryCode,
      newPassword)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })

}

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
}

const verifyUser = (dispatch) => (apiPath, verificationCode) => {
  return api.verifyUser(apiPath, verificationCode)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
}

const registerUser = (dispatch) => (apiPath, username, email, password) => {
  return api.registerUser(apiPath, username, email, password)
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
    return Promise.resolve(flow);
  })
}

const unrecoverableError = (dispatch) => (error) => {
  dispatch(throwError(error));
}

export default {
  types,
  unrecoverableError,

  bind: (dispatch) => ({
    signOn: signOn(dispatch),
    authorize: authorize(dispatch),

    changeUserPassword: changeUserPassword(dispatch),
    forgotPassword: forgotPassword(dispatch),
    sendRecoveryCode: sendRecoveryCode(dispatch),
    recoverUserPassword: recoverUserPassword(dispatch),
    sendVerificationCode: sendVerificationCode(dispatch),
    verifyUser: verifyUser(dispatch),
    registerUser: registerUser(dispatch),

    unrecoverableError: unrecoverableError(dispatch),
    updateFlow: updateFlow(dispatch),
    resetFlow: resetFlow(dispatch)
  })
};

import _ from 'lodash';

import {Flow, STATUS as LOGIN_RESULT_STATUS} from '../sdk/index';
import request from "superagent";

const types = {
  UPDATE_FLOW: 'UPDATE_FLOW',
  UNRECOVERABLE_ERROR: 'UNRECOVERABLE_ERROR',
  EXCEPTION: 'UNRECOVERABLE_ERROR',

  RESET_FLOW_SUCCESS: "RESET_FLOW_SUCCESS"
};

const URLS = {
  STAGING: {
    AUTH: 'https://auth-staging.pingone.com',
    API: 'https://api-staging.pingone.com/v1/environments',
  },
  PROD: {
    AUTH: 'https://auth.pingone.com',
    API: 'https://api.pingone.com/v1/environments',
  },
};

// Actions Creator

const updateFlowAction = (result, isAuthenticated = false) => ({
  type: types.UPDATE_FLOW,
  payload: {
    result,
    isAuthenticated
  }
});

const throwError = (error) => ({
      type: types.UNRECOVERABLE_ERROR,
      payload: {
        error: error
      }
    }
);

const updateFlow = (dispatch) => (result, isAuthenticated = false) => {
  dispatch(updateFlowAction(new Flow(result), isAuthenticated));
}

const resetFlow  = (dispatch) =>  (apiPath) => {
  makeRequest(apiPath, 'session.reset+json', {})
 .then((flow) => {
   dispatch(updateFlowAction(new Flow(flow)));
   return Promise.resolve(flow);
 })
 .catch((error) => {
   dispatch(throwError(error));
 })
}

const clientAuth = (dispatch) => (environmentId, responseType, clientId, redirectUri, scope, state) => {

  // let responseType;
  // if(grantType ==='authorization_code'){
  //   responseType = 'code'
  // } else if(grantType ==='implicit'){
  //   responseType = 'token'
  // } else if(grantType ==='client_credentials'){
  //   responseType = 'token'
  // }

  // Step 1: Initiate an authorization request
  return new Promise((resolved, rejected) =>
      request
      .get(`${getBaseApiUrl(true)}/${environmentId}/as/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&prompt=login`)
      .end((err, res) => (err ? rejected(err) : resolved(res)))
  )
  // Step 2: Retrieve the flow resource
  .then((result) => {
    const flowId = decomposeUrl(result.xhr.responseURL).queryParams['flowId'];

    if (flowId) {
      return new Promise((resolved, rejected) =>
          request
          .get(`${getBaseApiUrl(true)}/${environmentId}/flows/${flowId}`)
          .end((err, res) => {
            if (err) {
              rejected(_.get(res, 'body', err));
            } else {
              resolved(_.get(res, 'body', {}));
            }
          }));
    } else {
      return Promise.reject("There is no flow id");
    }
  })
  .then((flow) => {
    dispatch(updateFlowAction(new Flow(flow)));
  })
  .catch((error) => {
    // If a user inputs an incorrect username or password it is caught here.
    dispatch(throwError(error));
  });
}

const signOn = (dispatch) => (apiPath, username, password) => {
  const body = {};
  if (!_.isEmpty(username)) {
    // We are given a username and need to validate it.
    body.username = username;
  }
  if (!_.isEmpty(password)) {
    body.password = password;
  }

  return makeRequest(apiPath, 'usernamePassword.check+json', body);
};


const signOff = (dispatch) => (environmentId, logoutRedirectUri, token,
    state) => {
  let singOffUrl = `${getBaseApiUrl(
      true)}/${environmentId}/as/signoff?id_token_hint=${token}`;
  if (logoutRedirectUri && state) {
    singOffUrl.concat(
        `&post_logout_redirect_uri=${logoutRedirectUri}&state=${state}`);
  }

  window.location.assign(singOffUrl);

  // return new Promise((resolved, rejected) =>
  //     request
  //     .get(`${singOffUrl}`)
  //     .withCredentials()
  //     .end((err, res) => (err ? rejected(err) : resolved(res))))
  // .then((result) => {
  //   window.console.log(result);
  // });
}


const forgotPassword = (dispatch) => (apiPath, username) => {
  return makeRequest(apiPath, 'password.forgot+json', { username });
}

const sendRecoveryCode = (dispatch) => (apiPath) => {
  return makeRequest(apiPath, 'password.sendRecoveryCode+json');
}

const recoverUserPassword = (dispatch) => (apiPath, recoveryCode, newPassword) => {
  return makeRequest(apiPath, 'password.recover+json', { recoveryCode, newPassword });
}

const changeUserPassword = (dispatch) => (apiPath, username, currentPassword, newPassword) => {

  new Promise((resolved, rejected) =>
      request
      .post(`${apiPath}/changePassword`)
      .send({ username, currentPassword, newPassword })
      .set('accept', 'application/json')
      .end((err, res) => (err ? rejected(err) : resolved(res)))
  )
  .then((result) => {
    const loginResult = new Flow({ status: _.get(result, 'body.status') });
    dispatch(updateFlowAction(loginResult));
  })
  .catch((error) => {
    const isPasswordIncorrect = _.isEqual(_.get(error, 'response.body.details[0].code', null), 'INVALID_VALUE')
        && _.isEqual(_.get(error, 'response.body.details[0].target', null), 'password');

    const isNewPasswordBad = _.isEqual(_.get(error, 'response.body.details[0].code', null), 'INVALID_VALUE')
        && _.isEqual(_.get(error, 'response.body.details[0].target', null), 'newPassword');

    if (isPasswordIncorrect) {

          updateFlow(
              { status: LOGIN_RESULT_STATUS.UNAUTHORIZED }
          );
    } else if (isNewPasswordBad) {
      dispatch(
          updateFlow(
              { status: LOGIN_RESULT_STATUS.PASSWORD_REQUIREMENTS_NOT_MET }
          )
      );
    } else {
      dispatch(throwError(error));
    }
  })
};

const sendVerificationCode = (dispatch) => (apiPath) => {
  return makeRequest(apiPath, 'user.sendVerificationCode+json');
}

const verifyUser = (dispatch) => (apiPath, verificationCode) => {
  return makeRequest(apiPath, 'user.verify+json', {verificationCode});
}

const registerUser = (dispatch) => (apiPath, username, email, password) => {
  return makeRequest(apiPath, 'user.register+json', {username, email, password});
}


const unrecoverableError = (dispatch) => (error) =>{
  dispatch(throwError (error));
}

const getBaseApiUrl = (useAuthUrl) => {
  const host = decomposeUrl(window.location.href).host.split(':')[0];
  let urls = URLS.STAGING;

  if (host === 'localhost') {
    // setting here rather than in the URLS variable above to make jest tests work
    // since window.location isn't set when this is imported
    urls = URLS.PROD;
  }

  return useAuthUrl ?
      urls.AUTH : // base API URL for auth things like the flow orchestration service
      urls.API; // base API URL for non-auth things like branding
};

const decomposeUrl = (url) => {
  if (!url) {
    return {};
  }

  const a = document.createElement('a');
  a.href = url;

  return {
    host: a.host,
    pathname: a.pathname,
    search: a.search,
    queryParams: parseQueryParams(a.search),
    hash: a.hash,
  };
};

const parseQueryParams = (searchStr) => {
  const str = searchStr.replace(/^\?/, '');
  const params = str.split('&');

  const returnVal = {};

  _.forEach(params, (param) => {
    const paramSplit = param.split('=');
    returnVal[paramSplit[0]] = paramSplit[1];
  });

  return returnVal;
};

const makeRequest = (apiPath, contentType, body = {}) =>
    new Promise((resolved, rejected) =>
        request
        .post(apiPath)
        .withCredentials()
        .send(body)
        .set('Content-Type', `application/vnd.pingidentity.${contentType}`)
        .end((err, res) => {
          if (err) {
            rejected(res ? res.body : err);
          } else {
            resolved(res.body);
          }
        }));

export default {
  types,
  changeUserPassword,
  forgotPassword,
  sendRecoveryCode,
  recoverUserPassword,

  clientAuth,
  signOn,
  signOff,
  registerUser,
  sendVerificationCode,
  verifyUser,

  unrecoverableError,

  updateFlow,
  resetFlow,

  bind: (dispatch) => ({
    changeUserPassword: changeUserPassword(dispatch),
    forgotPassword : forgotPassword(dispatch),
    sendRecoveryCode: sendRecoveryCode(dispatch),
    recoverUserPassword: recoverUserPassword(dispatch),

    clientAuth: clientAuth(dispatch),
    signOn: signOn(dispatch),
    signOff: signOff(dispatch),

    sendVerificationCode: sendVerificationCode(dispatch),
    verifyUser: verifyUser(dispatch),
    registerUser : registerUser(dispatch),
    unrecoverableError: unrecoverableError(dispatch),
    updateFlow: updateFlow(dispatch),
    resetFlow:resetFlow (dispatch)
  })
};

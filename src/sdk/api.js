/**
 * PingOne authentication flow and OpenID Connect/OAuth 2 protocol API.
 *
 * Contains functions that correspond to steps needed to make it through a PingOne authentication flow.
 * Each function corresponds with an action the UI needs to take and call function(s) from actions.js
 */
import request from "superagent";
import config from "../config";

/******************************************************************************
 *         PingOne Authentication Flow Actions API
 ******************************************************************************/

const getFlow =  (environmentId, flowId) => {
  let flowUrl = `${getBaseApiUrl(true)}/${environmentId}/flows/${flowId}`;
  return get( flowUrl, true, {'Content-Type': 'application/json'}, true)
}
/**
 *  Login user
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param username user name
 * @param password user password
 */
const signOn = (apiPath, username, password) => {
  return pingPost(apiPath, 'usernamePassword.check+json', {username, password});
};

/**
 * Recover a user’s forgotten password.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param username user name
 */
const forgotPassword = (apiPath, username) => {
  return pingPost(apiPath, 'password.forgot+json', {username});
};

/**
 * Send the OTP to the user. The OTP is a randomly generated eight-character alphanumeric string sent to the user’s email address, and the code is valid for five minutes.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 */
const sendRecoveryCode = (apiPath) => {
  return pingPost(apiPath, 'password.sendRecoveryCode+json');
};

/**
 * Recover the account and set a new password.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param recoveryCode
 * @param newPassword
 */
const recoverUserPassword = (apiPath, recoveryCode,
    newPassword) => {
  return pingPost(apiPath, 'password.recover+json',
      {recoveryCode, newPassword});
};

/**
 * Change (or reset) the user’s password.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param username user name
 * @param currentPassword
 * @param newPassword
 */
const changeUserPassword = (apiPath, username, currentPassword,
    newPassword) => {
  return pingPost(apiPath, 'password.reset+json',
      {currentPassword, newPassword});
};

/**
 * Update (or reset) a flow orchestration session.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 */
const resetFlow = (apiPath) => {
  return pingPost(apiPath, 'session.reset+json', {})
};

/**
 * Send the user a new account verification email.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 */
const sendVerificationCode = (apiPath) => {
  return pingPost(apiPath, 'user.sendVerificationCode+json');
};

/**
 * Verify the user account to continue the authentication flow.
 * The user must click the link in the verification email to verify the account. The request body requires the verificationCode attribute identifying the verification code to check.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param verificationCode
 */
const verifyUser = (apiPath, verificationCode) => {
  return pingPost(apiPath, 'user.verify+json', {verificationCode});
};

/**
 * Register a new user.
 * @param apiPath PingOne for Customers authorization and authentication endpoint
 * @param username user name
 * @param email
 * @param password
 */
const registerUser = (apiPath, username, email, password) => {
  return pingPost(apiPath, 'user.register+json', {username, email, password});
};

const pingPost = (apiPath, contentType, body = {}) =>
    post(apiPath, `application/vnd.pingidentity.${contentType}`, body);

const post = (apiPath, contentType, body = {}) =>
    new Promise((resolved, rejected) =>
        request
        .post(apiPath)
        .withCredentials()
        .send(body)
        .set('Content-Type', contentType)
        .end((err, res) => {
          if (err) {
            rejected(res ? res.body : err);
          } else {
            resolved(res.body);
          }
        }));

const get = (apiPath, getBody = false, headers = {},
    withCredentials = false) => {
  return new Promise((resolved, rejected) => {
        let req = request
        .get(apiPath)
        .set(headers);

        if (withCredentials) {
          req = req.withCredentials();
        }
        req.end((err, res) => {
          if (err) {
            rejected(res ? res.body : err);
          } else {
            resolved(getBody ? res.body : res);
          }
        })
      }
  );
}


const getBaseApiUrl = (useAuthUrl) => {
  return useAuthUrl ?
      config.AUTH : // base API URL for auth things like the flow orchestration service
      config.API; // base API URL for non-auth things
};

export default {
  getFlow,
  resetFlow,

  signOn,
  changeUserPassword,
  forgotPassword,
  sendRecoveryCode,
  recoverUserPassword,

  registerUser,
  sendVerificationCode,
  verifyUser
}

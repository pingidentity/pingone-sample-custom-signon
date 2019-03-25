/**
 * PingOne authentication flow and OpenID Connect/OAuth 2 protocol API.
 *
 * Contains functions that correspond to steps needed to make it through a PingOne authentication flow.
 * Each function corresponds with an action the UI needs to take and call function(s) from actions.js
 */
import _ from "lodash";
import request from "superagent";
import config from "../config";

/******************************************************************************
 *         PingOne Authentication Flow Actions API
 ******************************************************************************/


/**
 * Authorization request to retrieve the flow resource
 * @param environmentId
 * @param responseType
 * @param clientId
 * @param redirectUri
 * @param scope
 * @returns {Promise<T | never>}
 */
const authorize = (environmentId, responseType, clientId, redirectUri, scope) => {
  let authUrl = `${getBaseApiUrl(
      true)}/${environmentId}/as/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`

  // Initiate an authorization request
  return get(authUrl)
  // Retrieve the flow resource
  .then(result => {
    const flowId = decomposeUrl(result.xhr.responseURL).queryParams['flowId'];

    if (flowId) {
      return get(`${getBaseApiUrl(true)}/${environmentId}/flows/${flowId}`,
          true)
    } else {
      return Promise.reject(
          "Please check authorization request. There is no flowID embedded in the Location header.");
    }
  })
};

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

/******************************************************************************
 *         OpenID Connect Protocol API
 ******************************************************************************/

/**
 * Ends the user session associated with the given ID token.
 * @param environmentId - a required attribute that specifies environment id
 * @param logoutRedirectUri - a string that specifies an optional parameter that specifies the URL to which the browser is redirected after a logout has been performed.
 * @param token  - a required attribute that specifies the ID token passed to the logout endpoint as a hint about the user’s current authenticated session.
 * @param state - a string that specifies an optional parameter that is used to maintain state between the logout request and the callback to the endpoint specified by the logoutRedirectUri query parameter
 * @see {@link https://openid.net/specs/openid-connect-session-1_0.html#RPLogout|RP-Initiated Logout}
 */
const signOff = (environmentId, logoutRedirectUri, token, state) => {
  let singOffUrl = `${getBaseApiUrl(
      true)}/${environmentId}/as/signoff?id_token_hint=${token}`;
  if (logoutRedirectUri && state) {
    singOffUrl = singOffUrl.concat(
        `&post_logout_redirect_uri=${logoutRedirectUri}&state=${state}`);
  }
  window.location.assign(singOffUrl);
};

/**
 * Get claims about the authenticated end user from UserInfo Endpoint (OAuth 2.0 protected resource)
 * A userinfo authorization request is used with applications associated with the openid resource.
 * @param environmentId
 * @param token
 */
const getUserInfo = (environmentId, token) => {
  return get(`${getBaseApiUrl(true)}/${environmentId}/as/userinfo`, true,
      {'Authorization': `Bearer ${token}`})
};

/******************************************************************************
 *         OAuth 2 Protocol API
 ******************************************************************************/

/**
 * Obtain an access token
 *
 * @param environmentId
 * @param clientId
 * @param clientSecret
 * @param redirectUri
 * @param responseType
 * @param grant_type authorization grant type
 * @param scope
 * @param state
 * @param prompt
 * @param maxAge
 * @returns {Promise<T | never>}
 */
const getAccessToken = (environmentId, clientId, clientSecret = null,
    redirectUri, responseType, grant_type = 'implicit', scope,
    state, prompt = 'login', maxAge) => {
  // Authorization request
  return post(`${getBaseApiUrl(
      true)}/${environmentId}/as/authorize`,
      'application/x-www-form-urlencoded',
      `response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&prompt=${prompt}`
      +
      (maxAge ? `&max_age=${maxAge}` : ''))
  .then(result => {
    if (!_.isEqual(grant_type, 'implicit')) {
      let code = result.body.token;
      return post(`${getBaseApiUrl(
          true)}/${environmentId}/as/token`,
          'application/x-www-form-urlencoded',
          `grant_type=${grant_type}&code=${code}&redirect_uri=${redirectUri}`
          + (clientSecret ? `&client_secret=${clientSecret}` : ''));
    } else {
      return Promise.resolve(result);
    }
  })
};

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

const pingPost = (apiPath, contentType, body = {}) =>
    post(apiPath, `application/vnd.pingidentity.${contentType}`, body);

const get = (apiPath, getBody = false, headers = {}) =>
    new Promise((resolved, rejected) =>
        request
        .get(apiPath)
        .set(headers)
        .end((err, res) => {
          if (err) {
            rejected(res ? res.body : err);
          } else {
            resolved(getBody ? res.body : res);
          }
        }));

const getBaseApiUrl = (useAuthUrl) => {
  return useAuthUrl ?
      config.AUTH : // base API URL for auth things like the flow orchestration service
      config.API; // base API URL for non-auth things
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

export default {
  signOff,
  getAccessToken,
  getUserInfo,

  authorize,
  signOn,
  resetFlow,
  changeUserPassword,
  forgotPassword,
  sendRecoveryCode,
  recoverUserPassword,

  registerUser,
  sendVerificationCode,
  verifyUser
}

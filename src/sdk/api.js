import _ from "lodash";
import request from "superagent";
import config from "../config";

const signOn = (apiPath, username, password) => {
  return pingPost(apiPath, 'usernamePassword.check+json', {username, password});
};

/**
 * Initiate end user logout.
 * @param environmentId - a required attribute that specifies environment id
 * @param logoutRedirectUri - a string that specifies an optional parameter that specifies the URL to which the browser is redirected after a logout has been performed.
 * @param token  - a required attribute that specifies the ID token passed to the logout endpoint as a hint about the user’s current authenticated session.
 * @param state - a string that specifies an optional parameter that is used to maintain state between the logout request and the callback to the endpoint specified by the logoutRedirectUri query parameter
 */
const signOff = (environmentId, logoutRedirectUri, token, state) => {
  let singOffUrl = `${getBaseApiUrl(
      true)}/${environmentId}/as/signoff?id_token_hint=${token}`;
  if (logoutRedirectUri && state) {
    singOffUrl = singOffUrl.concat(
        `&post_logout_redirect_uri=${logoutRedirectUri}&state=${state}`);
  }
  window.location.assign(singOffUrl);
}

const forgotPassword = (apiPath, username) => {
  return pingPost(apiPath, 'password.forgot+json', {username});
}

const sendRecoveryCode = (apiPath) => {
  return pingPost(apiPath, 'password.sendRecoveryCode+json');
}

const recoverUserPassword = (apiPath, recoveryCode,
    newPassword) => {
  return pingPost(apiPath, 'password.recover+json',
      {recoveryCode, newPassword});
}

const changeUserPassword = (apiPath, username, currentPassword,
    newPassword) => {
  return pingPost(apiPath, 'password.reset+json',
      {currentPassword, newPassword});
}

const resetFlow = (apiPath) => {
  return pingPost(apiPath, 'session.reset+json', {})
}

const authorize = (environmentId, responseType, clientId, redirectUri, scope,
    state, prompt = 'login') => {
  let authUrl = `${getBaseApiUrl(
      true)}/${environmentId}/as/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&prompt=${prompt}`

  // Initiate an authorization request
  return get(authUrl)
  // Retrieve the flow resource
  .then(result => {
    const flowId = decomposeUrl(result.xhr.responseURL).queryParams['flowId'];

    if (flowId) {
      return get(`${getBaseApiUrl(true)}/${environmentId}/flows/${flowId}`, true)
    } else {
      return Promise.reject("Please check authorization request. There is no flowID embedded in the Location header. ");
    }
  })
}

const getAccessToken = (environmentId, clientId, clientSecret = null, redirectUri, responseType, grant_type = 'implicit', scope ,
    state, prompt = 'login') => {
  // Authorization request
  return post(`${getBaseApiUrl(
      true)}/${environmentId}/as/authorize`, 'application/x-www-form-urlencoded', `response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&prompt=${prompt}`)
  .then(result => {
    if (!_.isEqual(grant_type, 'implicit')) {
      let code = result.body.token;
      return post(`${getBaseApiUrl(
          true)}/${environmentId}/as/token`, 'application/x-www-form-urlencoded', `grant_type=${grant_type}&code=${code}&redirect_uri=${redirectUri}` + (clientSecret? `&client_secret=${clientSecret}` : ''));
    } else {
      return Promise.resolve(result);
    }
  })
}

const getUserInfo = (environmentId, token) => {
  return get(`${getBaseApiUrl(true)}/${environmentId}/as/userinfo`, true, {'Authorization': `Bearer ${token}`})
}

const sendVerificationCode = (apiPath) => {
  return pingPost(apiPath, 'user.sendVerificationCode+json');
}

const verifyUser = (apiPath, verificationCode) => {
  return pingPost(apiPath, 'user.verify+json', {verificationCode});
}

const registerUser = (apiPath, username, email, password) => {
  return pingPost(apiPath, 'user.register+json', {username, email, password});
}

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
            rejected(res ? res : err);
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
  authorize,
  signOn,
  signOff,
  getAccessToken,

  resetFlow,

  changeUserPassword,
  forgotPassword,
  sendRecoveryCode,
  recoverUserPassword,

  registerUser,
  sendVerificationCode,
  verifyUser,
  getUserInfo

}

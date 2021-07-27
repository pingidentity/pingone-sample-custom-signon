/**
 * PingOne OpenID Connect/OAuth 2 protocol API
 */
import _ from "lodash";
import request from "superagent";
import config from "../config";
import IdTokenVerifier from "./jwt_verifier";

/******************************************************************************
 *         OAuth 2/OpenID Connect Protocol API
 ******************************************************************************/

/**
 *  Authorize the client
 *
 * @param state a string that specifies an optional parameter that is used to maintain state between the logout request and the callback to the endpoint specified by the post_logout_redirect_uri query parameter.
 * @param nonce a string that is used to associate a client session with an ID token, and to mitigate replay attacks. The value is passed through unmodified from the authentication request to the ID token.
 */
const authorize = (state, nonce) => {
  let authUrl = `${getBaseApiUrl(
      true)}/${config.environmentId}/as/authorize?` +
      `client_id=${config.clientId}&` +
      `redirect_uri=${config.redirectUri}&`+
      `response_type=${config.responseType ? config.responseType: 'token id_token'}` +
      (config.prompt ? `&prompt=${config.prompt}` : '') +
      (config.scope ? `&scope=${config.scope}` : '') +
      (config.maxAge ? `&max_age=${config.maxAge}` : '') +
      (config.acrValues ? `&acr_values=${config.acrValues}` : '') +
      (state ? `&state=${state}` : '') +
      (nonce ? `&nonce=${nonce}` : '');
  window.location.replace(authUrl);

};

/**
 * Ends the user session associated with the given ID token.
 * @param token  - a required attribute that specifies the ID token passed to the logout endpoint as a hint about the user’s current authenticated session.
 * @param state - a string that specifies an optional parameter that is used to maintain state between the logout request and the callback to the endpoint specified by the logoutRedirectUri query parameter
 * @see {@link https://openid.net/specs/openid-connect-session-1_0.html#RPLogout|RP-Initiated Logout}
 */
const signOff = (token, state) => {
  let singOffUrl = `${getBaseApiUrl(
      true)}/${config.environmentId}/as/signoff?id_token_hint=${token}`;
  if (config.logoutRedirectUri && state) {
    singOffUrl = singOffUrl.concat(
        `&post_logout_redirect_uri=${config.logoutRedirectUri}&state=${state}`);
  }
  window.location.assign(singOffUrl);
};

/**
 * Get claims about the authenticated end user from UserInfo Endpoint (OAuth 2.0 protected resource)
 * A userinfo authorization request is used with applications associated with the openid resource.
 * @param access_token access token
 */
const getUserInfo = (access_token) => {
  return get(`${getBaseApiUrl(true)}/${config.environmentId}/as/userinfo`, true,
      {'Authorization': `Bearer ${access_token}`})
};

/**
 * Obtain an access token in a format of:
 * {access_token: "bla", token_type: "Bearer", expires_in: 3600, scope: "address phone openid profile email", id_token: "bla"}
 *
 * Note that authentication requirements to this endpoint are configured by the application’s tokenEndpointAuthMethod property
 * @param code a string that specifies the authorization code returned by the authorization server. This property is required only if the grant_type is set to authorization_code
 */
const getAccessToken = (code) => {
  if (_.isEqual(config.tokenEndpointAuthMethod, 'client_secret_post')) {
    return post(`${getBaseApiUrl(
        true)}/${config.environmentId}/as/token`,
        {'Content-Type': 'application/x-www-form-urlencoded'},
        `grant_type=${config.grantType}&code=${code}&client_id=${config.clientId}`
        + (config.clientSecret ? `&client_secret=${config.clientSecret}` : '')
        + (config.redirectUri ? `&redirect_uri=${config.redirectUri}` : ''));
  } else if (_.isEqual(config.tokenEndpointAuthMethod, 'none')) {
    return post(`${getBaseApiUrl(
        true)}/${config.environmentId}/as/token`,
        {'Content-Type': 'application/x-www-form-urlencoded'},
        `grant_type=${config.grantType}&code=${code}&client_id=${config.clientId}`
        + (config.redirectUri ? `&redirect_uri=${config.redirectUri}` : ''));
  } else {
    return post(`${getBaseApiUrl(
        true)}/${config.environmentId}/as/token`,
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Base64 encoded "client_id:client_secret"
          'Authorization': `Basic ${window.btoa(config.clientId + ":" + config.clientSecret)}`
        },
        `grant_type=${config.grantType}&code=${code}`
        + (config.redirectUri ? `&redirect_uri=${config.redirectUri}` : ''));
  }
};

const getBaseApiUrl = (useAuthUrl) => {
  return useAuthUrl ?
      config.AUTH_URI : // base API URL for auth things like the flow orchestration service
      config.API_URI; // base API URL for non-auth things
};

const idTokenVerifier = IdTokenVerifier({issuer: `${getBaseApiUrl(true)}/${config.environmentId}/as`});
/**
 * Verify user id token. Issuer, audience, algorithms are verified by default
 *
 * @param id_token user id token
 * @param options token claims (i.e subject, issuer, audience etc ) to validate
 * @returns {Promise<*>}
 */
const verifyIdToken = (id_token, options) => {
  return idTokenVerifier.verify(id_token, {
    ...options,
    audience: config.clientId,
    algorithms: ['RS256']
  });
};

const post = (apiPath, headers, body = {}) =>
    new Promise((resolved, rejected) =>
        request
        .post(apiPath)
        .send(body)
        .set(headers)
        .end((err, res) => {
          if (err) {
            rejected(res ? res.body : err);
          } else {
            resolved(res.body);
          }
        }));

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


const parseHash = () => {
  return window.location.hash.replace('#', '').split('&').reduce(
      (prev, item) => {
        return Object.assign(
            {[item.split('=')[0]]: decodeURIComponent(item.split('=')[1])},
            prev);
      }, {});
};

const generateRandomValue = () => {
  let crypto = window.crypto || window.msCrypto;
  let D = new Uint32Array(2);
  crypto.getRandomValues(D);
  return D[0].toString(36);
};

/**
 * Recursively flattens JSON object with a keys with a prefix parameter and formatted by '_' character
 * Example: from {a: 1, b: {c: 2, d: 3}} to {a: 1, b_c: 2, b_d: 3}
 *
 * @param objectOrArray JSON object to flatten
 * @param prefix a prefix in each flattened object key
 * @param formatter function to make a custom key formatting
 * @returns flattened object
 */
export const flatten = (objectOrArray, prefix = '', formatter = (k) => (k)) => {
  const nestedFormatter = (k) => ('_' + k)
  const nestElement = (prev, value, key) => (
      (value && typeof value === 'object')
          ? { ...prev, ...flatten(value, `${prefix}${formatter(key)}`, nestedFormatter) }
          : { ...prev, ...{ [`${prefix}${formatter(key)}`]: value } });

  return Array.isArray(objectOrArray)
      ? objectOrArray.reduce(nestElement, {})
      : Object.keys(objectOrArray).reduce(
          (prev, element) => nestElement(prev, objectOrArray[element], element),
          {},
      );
};
/**
 * User Attribute Claims and their descriptions
 */
export const CLAIMS_MAPPING = {
  at_hash: 'Access Token hash value.',
  sub: 'User Identifier.',
  name: 'User\'s full name.',
  given_name: 'User given name(s) or first name(s).',
  family_name: 'Surname(s) or last name(s) of the User.',
  middle_name: 'User middle name.',
  nickname: 'User casual name.',
  preferred_username: 'User shorthand name.',
  email: 'User e-mail address.',
  updated_at: 'Last time User\'s information was updated.',
  amr: 'Authentication Methods Reference.',
  iss: 'Response Issuer Identifier.',
  nonce: 'Client session unique and random value.',
  aud: 'ID Token Audience.',
  acr: 'Authentication Context Class Reference.',
  auth_time: 'User authentication time.',
  exp: 'ID Toke expiration time.',
  iat: 'Time at which the JWT was issued.',
  address_country: 'Country name. ',
  address_postal_code: 'Zip code or postal code. ',
  address_region: 'State, province, prefecture, or region. ',
  address_locality: 'City or locality. ',
  address_formatted: 'Full mailing address. ',
  address_street_address: 'Full street address. ',
  amr_0: 'Authentication methods. '

};

export default {
  authorize,
  signOff,
  getAccessToken,
  getUserInfo,
  verifyIdToken,

  parseHash,
  generateRandomValue,
  flatten,

  CLAIMS_MAPPING
}

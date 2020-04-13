export default {
  /**
   * Application authorization details. For more information check "Getting Started" in README.md
    */
  // Specifies the environment’s UUID.
  environmentId: "<environmentId>",
  // Specifies the code or token type returned by an authorization request. Options are token, id_token, and code. Default values is "token id_token". This is a required property.
  responseType: "<responseType>",
  // Specifies the application’s UUID.
  clientId: "<clientId>",
  // Specifies the application’s secret key
  clientSecret: "<clientSecret>",
  // Specifies the grant type of the token request. Options are authorization_code, implicit, and client_credentials
  grantType: "implicit",
  // Specifies the URL that specifies the return entry point of the application. This is a required property.
  redirectUri: "http://localhost:8080",
  // Specifies an optional parameter that specifies the URL to which the browser is redirected after a logout has been performed.
  logoutRedirectUri: "http://localhost:8080",
  // Specifies permissions that determine the resources that the application can access. This parameter is not required, but it is needed to specify accessible resources.
  scope: "profile address email phone",
  // Specifies whether the user is prompted to login for re-authentication. The prompt parameter can be used as a way to check for existing authentication, verifying that the user is still present for the current session. For prompt=none, the user is never prompted to login to re-authenticate, which can result in an error if authentication is required. For prompt=login, if time since last login is greater than the max-age, then the current session is stashed away in the flow state and treated in the flow as if there was no previous existing session. When the flow completes, if the flow’s user is the same as the user from the stashed away session, the stashed away session is updated with the new flow data and persisted (preserving the existing session ID). If the flow’s user is not the same as the user from the stashed away session, the stashed away session is deleted (logout) and the new session is persisted.
  prompt: "login",
  // Specifies the client authentication methods supported by the token endpoint. This is a required property. Options are none, client_secret_basic, and client_secret_post.
  tokenEndpointAuthMethod: "client_secret_post",
  // Specifies the maximum amount of time allowed since the user last authenticated. If the max_age value is exceeded, the user must re-authenticate.
  maxAge: 3600,
  // Optional parameter that designates whether the authentication request includes steps for a single-factor or multi-factor authentication flow. This parameter maps to the name of a sign-on policy that must be assigned to the application. For more information, see Sign-on policies.
  //acrValues: "Single_Factor"

  API_URI: 'https://api.pingone.com/v1',
  AUTH_URI: 'https://auth.pingone.com'
};

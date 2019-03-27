# Introduction

This sample demonstrates how to initiate login actions that specify the operations required to authorize with a username and password. It uses PingOne flow orchestration service to authorize the application or user that initiated the authentication request. 
This service is responsible for initiating the authentication session and making calls to specific actions required by the authentication workflow.

Flow endpoint operations are used only to implement custom authentication UIs. 
OIDC/OAuth 2 requests initiate the flow and redirect the browser to the custom authentication UI (which is configured in the application through the application’s `loginPageUrl` property.)

## Application Type
PingOne supports several application types, but for this sample better to choose **Single page** (runs on the client side after it loads, so it can't keep a client secret) or **[Native](https://tools.ietf.org/html/rfc8252)** ( typically intended for mobile devices) application type with : auth code,  implicit or refresh token grant types.

The application type determines the authorization flow steps needed to acquire an access token from the authorization service. 

The following examples describe `authorization_code` and `implicit` [authorization flows](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_AuthActivities/p1-a_appAuth/) for the designated application type.


__Authorization code grant type__

This flow uses the `GET /{environmentId}/flows/{flowId}` endpoint to retrieve the login action steps, and the POST `/{environmentId}/flows/{flowId}/password` endpoint
 to validate the username and password required by the login action. After all login action steps in the flow are completed, the `GET /{environmentId}/as/resume` endpoint continues processing the authorization request.

`curl --request GET \
  --url 'https://auth.pingone.com/{environmentID}/as/resume?flowId={flowID}'`
After restarting the authorization flow, you can submit the authorization code through a request to the `POST /{environmentId}/as/token` endpoint to create the access token.

`curl --request POST \
  --url 'https://auth.pingone.com/{envID}/as/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=authorization_code&code={authCode}&redirect_uri=https%3A%2F%2Fexample.com'`
The **`grant_type`** and **`code`** parameter values **are required in the request body**. The `redirect_uri` is a required parameter only if it was included in the original `GET /{environmentId}/as/authorize` request.


__Implicit grant type__

Application is issued an access token without requiring an authorization code exchange. When the request is made to the `/{environmentId}/as/authorize` endpoint for an implicit grant, the value of the `response_type` parameter is set to `token` or `id_token`.
After all login action steps in the flow are completed successfully, the `GET /{environmentId}/as/resume` endpoint continues processing the authorization request.

`curl --request GET \
  --url 'https://auth.pingone.com/{environmentID}/as/resume?flowId={flowID}'`
The authorization service generates the access token for the application after restarting the authorization flow; it does not require a step to call the `/{environmentId}/as/token` endpoint.
The `response_type=` **`token`** or **`id_token`** **is required**.

## Application, grant and response type relationships
The following table shows the relationships between the application type attribute and the default `grantTypes`, `response_type`, and `tokenEndpointAuthMethod` attributes.

|    Application type   |    Grant type   |    Response type   |    Token endpoint authentication method   |
| --------------------- |   ------------- |------------------- |------------------------------------------ |
| Non-interactive	| client_credentials	| token	| client_secret_basic| 
| Native	| authorization_code, implicit	| token, id_token, code	| none| 
| Web	| authorization_code	| code	| client_secret_basic| 
| Single-page	| implicit	| token, id_token	| none| 

# Prerequisites 
You will need the following things:

- PingOne for Customers Account - If you don’t have an existing one, please register it.
- An new [Application](https://documentation.pingidentity.com/pingone/p14cAdminGuide/index.shtml#p1_t_addApplication.html), configured for Single-Page App (SPA) or Native mode. Also make sure that it is enabled plus redirect, sign off URL's and access grants by scopes are properly set.

# Getting Started

1. Clone a source code
`git clone git@github.com:pingidentity/pingone-customers-sample-custom-signon.git . `
2. Update [config.js](./src/config.js) with your application data extracted from P14C admin console:
    - `environment_id`: *Required*. Your application's Environment ID. You can find this value at your Application's Settings under 
    **Configuration** tab from the admin console( extract `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` string that specifies the environment 128-bit universally unique identifier ([UUID](https://tools.ietf.org/html/rfc4122)) right from `https://auth.pingone
    .com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/as/authorize` 
    *AUTHORIZATION URL* ). Or from the *Settings* main menu (*ENVIRONMENT ID* variable)
    - `client_id`: *Required*. Your application's client UUID. You can also find this value at Application's Settings right under the 
    Application name.
    - `clientSecret`: A string that specifies the the application’s client secret. This property is required only if the application’s `tokenEndpointAuthMethod` property is set to `CLIENT_SECRET_POST`.
    - `responseType`: A string that specifies the code or token type returned by an authorization request. Options are `token`, `id_token`, and `code`. This is a required property.
    - `redirectUri`: *Required*. The URL to which the PingOne will redirect the user's browser after authorization has been granted by the user. *REDIRECT URLS* values corresponds to this data. The Access and ID Token will be available in the hash fragment of this URL. 
    For simplicity this sample has it hardcoded as `http://localhost:3000/callback`, where `/callback` is handled by [callback react component](src/components/callback.jsx)
    - `logoutRedirectUri`: The URL to which the browser is redirected after a logout has been performed. *SIGNOFF URLS* values corresponds to this data.
    - `scope`: A string that specifies permissions that determine the resources that the application can access. This parameter is not required, but it is needed to specify accessible resources.
    - `grantType`: A string that specifies the grant type of the token request. Options are `authorization_code`, `implicit`, and `client_credentials`
    - `tokenEndpointAuthMethod`: A string that specifies the client authentication methods supported by the token endpoint. This is a required property. Options are `none`, `client_secret_basic`, and `client_secret_post`.
3. Build a project by `npm install` or `yarn install`
4. Start an application by `npm start` or `yarn start`


## PingOne for Customers API used in this sample
### Authentication API:
|    Endpoint   |    Description   |
| ------------- |------------- |
| [`POST /{environmentId}/as/authorize`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Authorize/#Authorization-request-with-a-code-grant) <br>  `prompt=login` parameter is used by default  | Authorization request with a code or implicit grant type.|
| [`POST /{environmentId}/as/token`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Authorize/#Obtain-an-access-token)  | Obtain an access token in authorization grant case|
| [`GET /{environmentID}/as/signoff?id_token_hint={idToken}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Authorize/#Get-signoff) <br> if `post_logout_redirect_uri` parameter is provided and it does not match one of the `postLogoutRedirectUri` values of your application in the specified environment - it would be handled as an unpredictable error.  | Obtain an access token in authorization grant case|

### Flow API:
|    Endpoint   |    Description   |
| ------------- |------------- |
| [`GET /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Get-a-flow) <br> `Content-Type: application/json` | Retrieve information about a flow |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Reset-a-flow) <br> `Content-Type: application/vnd.pingidentity.session.reset+json`  | Update (or reset) a flow orchestration session |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Register-a-user) <br> `Content-Type: application/vnd.pingidentity.user.register+json`  | Register a user |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Login-with-username-and-password) <br> `Content-Type: application/vnd.pingidentity.usernamePassword.check+json`  | Login with username and password|
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Reset-password) <br> `Content-Type: application/vnd.pingidentity.password.reset+json`  | Change (or reset) the user’s password |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Recover-password) <br> `Content-Type: application/vnd.pingidentity.password.recover+json`  | Recover the account and set a new password |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Send-recovery-code) <br> `Content-Type: application/vnd.pingidentity.password.sendRecoveryCode`  | Send the OTP to the user |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Verify-user) <br> `Content-Type: application/vnd.pingidentity.user.verify+json`  | Verify the user account to continue the authentication flow |
| [`POST /{environmentId}/flows/{flowID}`](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_Flows/#Send-verification-email) <br> `Content-Type: application/vnd.pingidentity.user.sendVerificationCode+json`  | Send the user a new account verification email |


**Note:** For any application type (except non-interactive), you can specify either `none`, `client_secret_basic`, or `client_secret_post` as the `tokenEndpointAuthMethod` attribute value. Non-interactive applications use the `client_credentials` grant type, which does not support a `tokenEndpointAuthMethod` value of none.

# Developer Notes

This sample includes scripts and configuration used by [Create React App](https://github.com/facebook/create-react-app). So you don’t need to install or configure tools like Webpack or Babel.
They are preconfigured and hidden so that you can focus on the code.

1. In case you want to experience more OIDC and other [PingOne for Customers Management APIs](https://apidocs.pingidentity.com/pingone/customer/v1/api/man/) without enforcing CORS, you can open another instance of chrome with disabled security (without closing other running chrome instances):
on Mac terminal:
```bash
open -n -a "Google Chrome" --args --user-data-dir=/tmp/temp_chrome_user_data_dir http://localhost:3000/ --disable-web-security
```
Otherwise you will see such error like *"No 'Access-Control-Allow-Origin' header is present on the requested resource"* on some actions.


2. `combineReducers` resulting reducer calls every child reducer, and gathers their results into a single _state_ object. __The state produced by combineReducers() namespaces the states of each reducer under their keys as passed to combineReducers()__
Example:
```typescript jsx
rootReducer = combineReducers({flow: flowReducer, user: userReducer})
// This would produce the following state object
{
  flow: {
    // ... flow, and other state managed by the flowReducer ...
  },
  user: {
    // ... user, and other state managed by the userReducer ...
  }
}
```

3. `componentDidMount` is only called once in the lifecycle of any component, re-render will not reinitialize the component. `componentDidUpdate` will be called where you can manage your logic.
4. Redux state doesn't remain after a page reload. `window.location = '/addMembers'` cause a page reload and it's not the correct way to programmatically navigate to another page when you use react-router. Instead of that you should use `this.props.history.push('/addMembers')`.


# Best Practises
1. keep UI state and transitory data (such as form inputs) in local state (i.e [controlled component](https://reactjs.org/docs/forms.html#controlled-components) to fill out a form).
2. keep data that you intend to share across components in Redux store.
3. we used [`redux-freeze`](https://www.npmjs.com/package/redux-freeze) middleware that is useful during development mode to ensure that no part of the app accidentally mutates the state (error will be thrown by the runtime).


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# Available Scripts

In the project directory, you can run:

### `npm start` or `yarn start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser. If you see CORS related issues like **"Origin is not allowed by Access-Control-Allow-Origin"**, please open another instance of your browser with disabled security.
If you are using Chrome on Mac OS, then start it as:
```bash
open -n -a "Google Chrome" --args --user-data-dir=/tmp/temp_chrome_user_data_dir http://localhost:3000/ --disable-web-security
```

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`  or `yarn test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`  or `yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

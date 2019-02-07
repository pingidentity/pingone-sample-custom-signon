This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start` or `yarn start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

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

## Intro

When a user logs in, P14C returns such items:

- access_token: to learn more, see the Access Token documentation
- token_type: 
- expires_in: the number of seconds before the Access Token expires
- scope
- id_token: to learn more, see the ID Token documentation
so you can use these items in your application to set up and manage authentication.



__Flows__

The PingOne flow orchestration service configures the steps required to authenticate the application or user that initiated the authentication request. The service is responsible for initiating the authentication session and making calls to specific actions required by the authentication workflow.

__Flow actions__
The flow endpoint is used to interact with the end-user in a sign-on workflow. Flow endpoint operations are used only to implement custom authentication UIs. 
OIDC/OAuth 2 and SAML requests initiate the flow and redirect the browser to the custom authentication UI (which is configured in the application through the application’s loginPageUrl property.)

This sample demonstrates how to initiate login actions that specify the operations required to authenticate with a username and password.

The application type determines the authorization flow steps needed to acquire an access token from the authorization service. 
The following example describe common [authorization flows](https://apidocs.pingidentity.com/pingone/customer/v1/api/auth/p1-a_AuthActivities/p1-a_appAuth/) for the designated application type.

__authorization code grant type__

This flow uses the `GET /{environmentId}/flows/{flowId}/steps/{stepId}` endpoint to retrieve the login action steps, and the POST `/{environmentId}/flows/{flowId}/steps/{stepId}/password` endpoint
 to validate the username and password required by the login action. After all login action steps in the flow are completed, the `GET /{environmentId}/as/resume` endpoint continues processing the authorization request.

curl --request GET \
  --url 'https://auth.pingone.com/{environmentID}/as/resume?flowId={flowID}'
After restarting the authorization flow, you can submit the authorization code through a request to the `POST /{environmentId}/as/token` endpoint to create the access token.

curl --request POST \
  --url 'https://auth.pingone.com/{envID}/as/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=authorization_code&code={authCode}&redirect_uri=https%3A%2F%2Fexample.com'
The `grant_type` and `code` parameter values are required in the request body. The `redirect_uri` is a required parameter only if it was included in the original `GET /{environmentId}/as/authorize` request.


__implicit grant type.__

 the application is issued an access token without requiring an authorization code exchange. When the request is made to the /{environmentId}/as/authorize endpoint for an implicit grant, the value of the response_type parameter is set to token or id_token.
After all login action steps in the flow are completed successfully, the GET /{environmentId}/as/resume endpoint continues processing the authorization request.

curl --request GET \
  --url 'https://auth.pingone.com/{environmentID}/as/resume?flowId={flowID}'
The authorization service generates the access token for the application after restarting the authorization flow; it does not require a step to call the /{environmentId}/as/token endpoint.



|    Grant Type   |    Endpoints |      Details   |
| ------------- |------------- |------------- |
| `authorization_code` | GET or POST `/{environmentId}/as/authorize?response_type=code&client_id={appID}&redirect_uri=https://example.com&scope=p1:read:env:population&acr_values=Single_Factor&prompt=login'`| `response_type=code` is required. |
|
|    Grant Type   |    Endpoints |      Details   |
| ------------- |------------- |------------- |
| `implicit` | GET or POST `/{environmentId}/as/authorize?client_id={applicationID}&redirect_uri=https://example.com&response_type=token id_token&scope=openid profile p1:read:env:population&acr_values=Single_Factormax_age=86400'`| `response_type=` `token` or `id_token` is required.
                                                                                                                                                                                                                
 |
|

##Prerequi
you need to specify the following:
Configuration for your application and domain
Response type, to show that you need a user's Access Token and an ID Token after authentication
Audience and scope, specifying that you need an access_token that can be used to invoke the /userinfo endpoint.
The URL where you want to redirect your users after authentication.

post_logout_redirect_uri parameter is provided and it does not match one of the postLogoutRedirectUri values of any application in the specified environment, this condition is handled as an un-redirectable error.

## Developer Notes

This sample includes scripts and configuration used by [Create React App](https://github.com/facebook/create-react-app). sp you don’t need to install or configure tools like Webpack or Babel.
They are preconfigured and hidden so that you can focus on the code.

1. In case you want to experience more OIDC and other [PingOne for Customers Management APIs](https://apidocs.pingidentity.com/pingone/customer/v1/api/man/) without enforcing CORS, you can open another instance of chrome with disabled security (without closing other running chrome instances):
on Mac terminal:
```bash
open -n -a "Google Chrome" --args --user-data-dir=/tmp/temp_chrome_user_data_dir http://localhost:3000/ --disable-web-security
```
Otherwise you will see such error like *"No 'Access-Control-Allow-Origin' header is present on the requested resource"* on some actions.


2. `combineReducers`  resulting reducer calls every child reducer, and gathers their results into a single _state_ object. __The state produced by combineReducers() namespaces the states of each reducer under their keys as passed to combineReducers()__
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


### Best practises
1. keep UI state and transitory data (such as form inputs) in local state (i.e [controlled component](https://reactjs.org/docs/forms.html#controlled-components) to fill out a form).
2. keep data that you intend to share across components in Redux store.
3. we used [`redux-freeze`](https://www.npmjs.com/package/redux-freeze) middleware that is useful during development mode to ensure that no part of the app accidentally mutates the state (error will be thrown by the runtime).

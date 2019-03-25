const common = {
  branding: {
    logo: require('./logo-pingidentity.png')
  },
  authDetails: {
    environmentId: "c2c2b4f8-c3da-4b23-abef-457ceaf25591",
    responseType: "token id_token",
    clientId: "1eb1030b-36fc-4584-a0c5-6366a539f73a",
    clientSecret: null,
    redirectUri: "http://localhost:3000/callback",
    logoutRedirectUri: "http://localhost:3000",
    scope: "profile address email phone",
    prompt: "login",
    maxAge: 3600
  },
};

const stg = {
  AUTH: 'https://auth-staging.pingone.com',
  API: 'https://api-staging.pingone.com/v1/environments'
};

const prod = {
  AUTH: 'https://auth.pingone.com',
  API: 'https://api.pingone.com/v1/environments'
};

// Default to prod if not set
let config = prod;
if (process.env.REACT_APP_STAGE === 'stg') {
  config = stg;
}

export default {
  // Add common config values here
  ...common,
  ...config
};

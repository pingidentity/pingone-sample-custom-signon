const common = {
  branding: {
    logo: require('./logo.png')
  }
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

const dev = {
  branding: {
    logo: require('./logo-pingidentity.png')
  },
  authDetails: {
    environmentId: "c2c2b4f8-c3da-4b23-abef-457ceaf25591",
    responseType: "token id_token",
    clientId: "1eb1030b-36fc-4584-a0c5-6366a539f73a",
    redirectUri: "http://localhost:3000/callback",
    //p1:reset:self:userPassword,p1:read:self:userPassword,p1:read:self:user,p1:update:self:user p1:validate:self:userPassword
    scope: "openid profile address email phone"
  }
};


const prod = {
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === 'prod'
    ? prod
    : dev;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  ...config
};

import _ from 'lodash';

import { RequiredProperties } from './helpers';

export const STATUS = {
  SUCCESS: 'SUCCESS',
  UNAUTHORIZED: 'UNAUTHORIZED',

  COMPLETED: 'COMPLETED',
  USERNAME_PASSWORD_REQUIRED: 'USERNAME_PASSWORD_REQUIRED',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NO_PASSWORD: 'NO_PASSWORD',
  PASSWORD_EXPIRED: 'PASSWORD_EXPIRED',
  PASSWORD_LOCKED_OUT: 'PASSWORD_LOCKED_OUT',
  MUST_CHANGE_PASSWORD: 'MUST_CHANGE_PASSWORD',
  PASSWORD_REQUIREMENTS_NOT_MET: 'PASSWORD_REQUIREMENTS_NOT_MET',
  VERIFICATION_CODE_REQUIRED: 'VERIFICATION_CODE_REQUIRED',
  RECOVERY_CODE_REQUIRED: 'RECOVERY_CODE_REQUIRED',
  INVALID_VALUE: 'INVALID_VALUE',
  UNIQUENESS_VIOLATION: 'UNIQUENESS_VIOLATION',
  UNKNOWN: 'UNKNOWN',
  FAILED: 'FAILED'
};

export class Flow {
  constructor({ id, status , _links,  _embedded, resumeUrl }) {
    this.id = id;
    this.links = _links;
    this.embedded = _embedded;
    this.status = _.get(STATUS, status, STATUS.UNKNOWN);
    this.resumeUrl = resumeUrl;
  }

  isPasswordExpired() {
    return _.isEqual(this.status, STATUS.PASSWORD_EXPIRED);
  }

  isCompleted() {
    return _.isEqual(this.status, STATUS.COMPLETED);
  }

  isFailed() {
    return _.isEqual(this.status, STATUS.FAILED);
  }

  isRecoveryCodeRequired() {
    return _.isEqual(this.status, STATUS.RECOVERY_CODE_REQUIRED);
  }

  getLinks() {
    return this.links;
  }

  getPasswordPolicy() {
    return this.embedded.passwordPolicy;
  }

  getUser() {
    return this.embedded.user;
  }

  getPasswordPolicyMessage(policy) {
    const { passwordPolicy } = this.embedded;

    if (!passwordPolicy) {
      return {};
    }

    let requirement;
    if (policy.name === RequiredProperties.MIN_SPECIAL) {
      requirement = _.get(_.get(passwordPolicy, 'minCharacters'), RequiredProperties.MIN_SPECIAL);
      return _.get(generatePasswordPolicyMessage(requirement), 'minSpecial');
    } else if (policy.name === RequiredProperties.MIN_LOWERCASE) {
      requirement = _.get(_.get(passwordPolicy, 'minCharacters'), RequiredProperties.MIN_LOWERCASE);
      return _.get(generatePasswordPolicyMessage(requirement), 'minLower');
    } else if (policy.name === RequiredProperties.MIN_UPPERCASE) {
      requirement = _.get(_.get(passwordPolicy, 'minCharacters'), RequiredProperties.MIN_UPPERCASE);
      return _.get(generatePasswordPolicyMessage(requirement), 'minUpper');
    } else if (policy.name === RequiredProperties.MIN_NUMERIC) {
      requirement = _.get(_.get(passwordPolicy, 'minCharacters'), RequiredProperties.MIN_NUMERIC);
      return _.get(generatePasswordPolicyMessage(requirement), 'minNumeric');
    }

    return _.get(generatePasswordPolicyMessage(_.get(passwordPolicy, policy.name)), policy.name);
  }
}

export const generatePasswordPolicyMessage = (value) => ({
  maxRepeatedCharacters: `No more than ${value} repeated character${value > 1 ? 's' : ''}`,
  minUniqueCharacters: `${value} unique character${value > 1 ? 's' : ''}`,
  length: `${value.min} character${value.min > 1 ? 's' : ''}`,
  minNumeric: `${value} number`,
  minLower: `${value} lowercase character${value > 1 ? 's' : ''}`,
  minUpper: `${value} UPPERCASE character${value > 1 ? 's' : ''}`,
  minSpecial: `${value} special character${value > 1 ? 's' : ''}`,
  minComplexity: 'Must be a strong password',
});


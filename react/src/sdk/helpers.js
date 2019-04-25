import React from 'react';
import _ from 'lodash';
import bigInt from 'big-integer';

export const RequiredProperties = {
  MAX_REPEATED_CHARACTERS: 'maxRepeatedCharacters',
  MIN_UNIQUE_CHARACTERS: 'minUniqueCharacters',
  LENGTH: 'length',
  MIN_CHARACTERS: 'minCharacters',
  MIN_LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  MIN_UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  MIN_NUMERIC: '1234567890',
  MIN_SPECIAL: '~!@#$%^&*()-_=+[]{}|;:,.<>/?',
  MIN_COMPLEXITY: 'minComplexity',
};

const minCharCheck = (password, charSet, min) => {
  const count = _.sumBy(password, (char) => (_.includes(charSet, char) ? 1 : 0));
  return count >= min;
};

export const validate = (passwordPolicy, policyCriterion, password) => {
  switch (policyCriterion) {
    case RequiredProperties.MAX_REPEATED_CHARACTERS: {
      const maxRepeatedCharCount = _.get(passwordPolicy, policyCriterion);
      if (password.length < maxRepeatedCharCount) {
        return false;
      }

      for (let i = 0; i < password.length; i += 1) {
        const currentChar = password[i];
        let currentCharCount = 1;
        for (let j = i + 1; j < password.length; j += 1) {
          if (password[j] !== currentChar) {
            break;
          }

          currentCharCount += 1;

          if (currentCharCount > maxRepeatedCharCount) {
            return false;
          }
        }
      }

      return true;
    }
    case RequiredProperties.MIN_UNIQUE_CHARACTERS: {
      const minUniqueCharCount = _.get(passwordPolicy, policyCriterion);
      const count = new Set();
      _.each(password, (char) => {
        count.add(char);
      });
      return count.size >= minUniqueCharCount;
    }
    case RequiredProperties.LENGTH: {
      const lengthValidationRequirements = _.get(passwordPolicy, policyCriterion);
      return (
          (password.length >= lengthValidationRequirements.min) &&
          (password.length <= lengthValidationRequirements.max)
      );
    }
    case RequiredProperties.MIN_NUMERIC: {
      return minCharCheck(
          password,
          RequiredProperties.MIN_NUMERIC,
          _.get(passwordPolicy, [RequiredProperties.MIN_CHARACTERS, RequiredProperties.MIN_NUMERIC])
      );
    }
    case RequiredProperties.MIN_LOWERCASE: {
      return minCharCheck(
          password,
          RequiredProperties.MIN_LOWERCASE,
          _.get(passwordPolicy, [RequiredProperties.MIN_CHARACTERS, RequiredProperties.MIN_LOWERCASE])
      );
    }
    case RequiredProperties.MIN_UPPERCASE: {
      return minCharCheck(
          password,
          RequiredProperties.MIN_UPPERCASE,
          _.get(passwordPolicy, [RequiredProperties.MIN_CHARACTERS, RequiredProperties.MIN_UPPERCASE])
      );
    }
    case RequiredProperties.MIN_SPECIAL: {
      return minCharCheck(
          password,
          RequiredProperties.MIN_SPECIAL,
          _.get(passwordPolicy, [RequiredProperties.MIN_CHARACTERS, RequiredProperties.MIN_SPECIAL])
      );
    }
    case RequiredProperties.MIN_COMPLEXITY: {
      const guessesPerSecond = 100000000000;
      const secondsInSevenDays = 604800;
      const minComplexity = bigInt(guessesPerSecond).times(secondsInSevenDays);
      if (password.length === 0) {
        return 0;
      }

      // Determine the search space depth for the password.  If the password
      // contains any characters from outside the four defined character sets
      // (lowercase ASCII letters, uppercase ASCII letters, ASCII digits, and
      // ASCII symbols), then the depth is automatically 256.  Otherwise, the
      // depth is the num of the number of characters in each set contained in the
      // password.
      let hasLowerLetter = false;
      let hasUpperLetter = false;
      let hasDigit = false;
      let hasSymbol = false;
      let hasOther = false;
      _.each(password, (char) => {
        if (char >= 'a' && char <= 'z') {
          hasLowerLetter = true;
        } else if (char >= 'A' && char <= 'Z') {
          hasUpperLetter = true;
        } else if (char >= '0' && char <= '9') {
          hasDigit = true;
        } else if (char >= ' ' && char <= '~') {
          hasSymbol = true;
        } else {
          hasOther = true;
          return false;
        }

        return true;
      });

      // Determine the search space depth for the password.  If the password
      // contains any characters from outside the four defined character sets
      // (lowercase ASCII letters, uppercase ASCII letters, ASCII digits, and
      // ASCII symbols), then the depth is automatically 256.  Otherwise, the
      // depth is the num of the number of characters in each set contained in the
      // password.
      let searchSpaceDepth = 0;
      if (hasOther) {
        searchSpaceDepth = 256;
      } else {
        if (hasLowerLetter) {
          searchSpaceDepth += 26;
        }

        if (hasUpperLetter) {
          searchSpaceDepth += 26;
        }

        if (hasDigit) {
          searchSpaceDepth += 10;
        }

        if (hasSymbol) {
          searchSpaceDepth += 33;
        }
      }

      let searchSpaceSize = bigInt(0);
      for (let i = 1; i <= password.length; i += 1) {
        const guessesForLength = bigInt(searchSpaceDepth).pow(i);
        searchSpaceSize = searchSpaceSize.add(guessesForLength);
      }

      return searchSpaceSize.compare(minComplexity) > -1; // -1 means searchSpaceSize < minComplexity, 0 means =, 1 means >
    }
    default: {
      return false;
    }
  }
};

export const passwordRequirementsValidator = (passwordPolicy, newPassword) => {
  const clientValidatedRequirements = _.filter(_.keys(passwordPolicy),
      (policy) => policy === RequiredProperties.MAX_REPEATED_CHARACTERS ||
          policy === RequiredProperties.MIN_UNIQUE_CHARACTERS ||
          policy === RequiredProperties.MIN_COMPLEXITY ||
          policy === RequiredProperties.LENGTH);

  // special handling to flatten minChars so each can be validated separately
  const minCharReqs = _.get(passwordPolicy, RequiredProperties.MIN_CHARACTERS);
  _.each(minCharReqs, (key, value) => clientValidatedRequirements.push(`${value}`));

  const errors = _.map(clientValidatedRequirements,
      (policyName) => ({
        name: policyName,
        isValid: validate(passwordPolicy, policyName, newPassword),
      }));

  return errors;
};

export const getServerValidatedRequirementMessage = (failedReq, passwordPolicy) => {
  switch (failedReq) {
    case 'history': {
      const historyCount = _.get(passwordPolicy, 'history.count', null);

      // Fallback if for whatever reason we cannot load history.count
      if (historyCount === null) {
        return 'Password must not be similar to your prevous passwords';
      }

      return `Password cannot be the same or similar to your previous ${historyCount} passwords.`;
    }
    case 'excludesProfileData':
      return 'Password cannot contain information from your user profile.';
    case 'notSimilarToCurrent':
      return 'Password cannot be similar to your current password.';
    case 'excludesCommonlyUsed':
      return 'Password must not be a commonly used password.';
    case 'minComplexity':
      return 'Password does not meet minimum complexity requirements.';
    default:
      return 'Password does not meet requirements.';
  }
};

export const generateRequirementsTooltip = (clientValidatedRequirements, flow) =>
    _.map(clientValidatedRequirements,
        (policy) => {
          const icon = policy.isValid ?
              <i className="fa fa-check" style={{color:'green'}}></i> :
              <i className="fa fa-warning" style={{color:'red'}}></i>;

          return (
              <div key={policy.name} className="requirement">
                {icon}
                <span className="requirement__name">{flow.getPasswordPolicyMessage(policy)}</span>
              </div>
          );
        });

export const getURLParameter = (paramName) => {
  const urlParts = decomposeUrl(window.location.href);
  return urlParts.queryParams[paramName];
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

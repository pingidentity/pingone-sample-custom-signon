import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

const styles = {
  facebook: {
    innerButtonTable: {
      width: '100%',
      backgroundColor: '#4267b2',
      color: '#fff',
      borderRadius: '4px',
      height: '40px',
    },
    innerButtonTr: {
      border: '0',
      borderCollapse: 'collapse',
      borderSpacing: '0',
    },
    textTd: {
      textAlign: 'center',
      fontFamily: 'Helvetica, Arial, sans-serif',
      letterSpacing: '0.25px',
      WebkitFontSmoothing: 'auto',
      paddingRight: '40px',
    },
  },
};

const onChooseSocialProvider = (socialProvider) => {
  window.location.href = socialProvider._links.authenticate.href;
}
const SocialProviders = ({ socialProviders }) => {

  return (
      <div className="form" data-id="social-providers">
        {_.map(socialProviders, (socialProvider, index) => {
          const marginTopStyle = index === socialProviders.length - 1 ? {
            marginTop: '0',
          } : undefined;

          if (socialProvider.type === 'FACEBOOK') {
            return (
                <div
                    key={socialProvider.name}
                    role="button"
                    style={{ cursor: 'pointer', ...marginTopStyle }}
                    tabIndex="0"
                    data-id={`${socialProvider.name}-btn`}
                    onClick={() => onChooseSocialProvider(socialProvider)}
                >
                  <table style={styles.facebook.innerButtonTable}>
                    <tbody >
                    <tr style={styles.facebook.innerButtonTr}>
                      <td style={{ width: '40px', padding: '0', lineHeight: '12px' }}>
                      <span style={{ margin: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216" color="#fff" style={{ height: '24px' }}>
                          <path
                              fill="#FFFFFF" d="
                            M204.1 0H11.9C5.3 0 0 5.3 0 11.9v192.2c0 6.6 5.3 11.9 11.9
                            11.9h103.5v-83.6H87.2V99.8h28.1v-24c0-27.9 17-43.1 41.9-43.1
                            11.9 0 22.2.9 25.2 1.3v29.2h-17.3c-13.5 0-16.2 6.4-16.2
                            15.9v20.8h32.3l-4.2 32.6h-28V216h55c6.6 0 11.9-5.3
                            11.9-11.9V11.9C216 5.3 210.7 0 204.1 0z"
                          />
                        </svg>
                      </span>
                      </td>
                      <td style={styles.facebook.textTd}>
                        Log in With Facebook
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
            );
          }

          return (
              <button
                  key={socialProvider.name}
                  className="button social-provider"
                  data-id={`${socialProvider.name}-btn`}
                  onClick={() => onChooseSocialProvider(socialProvider)}
                  style={marginTopStyle}
              >
                Sign on with {socialProvider.name}
              </button>
          );
        })}
      </div>
  );
};

SocialProviders.propTypes = {
  socialProviders: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    _links: PropTypes.shape({
      authenticate: PropTypes.shape({
        href: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  })).isRequired
};

export default SocialProviders;

import React from 'react';
import PropTypes from 'prop-types';
import {flatten, CLAIMS_MAPPING} from '../sdk/api';

/**
 * React component for displaying user id token information of data from the UserInfo endpoint, that returns claims about the authenticated end user
 */
class InfoTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };

    this.hideData = this.hideData.bind(this);
    this.showData = this.showData.bind(this);
  }

  hideData() {
    this.setState({
      show: false
    });
  }

  showData() {
    this.setState({
      show: true
    });
  }

  render() {
    const userData = this.props.data? flatten(this.props.data) : null;
    return this.state.show && userData ? (
        <div>
          <div className="input-field">
            <table className="table">
              <thead>
              <tr>
                <th>Claim</th>
                <th>Value</th>
              </tr>
              </thead>
              <tbody>
              {Object.keys(this.props.data).map(key => (
                  <tr key={key}>
                    <td>{CLAIMS_MAPPING[key]
                        ? CLAIMS_MAPPING[key]
                        : key}</td>
                    <td>{this.props.data[key]}</td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
          <div className="input-field">
            <button type="button"
                    onClick={this.hideData}> Hide {this.props.btnLabel}
            </button>
          </div>
        </div>
    ) : (
        <div className="input-field">
          <button type="button"
                  onClick={this.showData}> Show {this.props.btnLabel}
          </button>
        </div>
    )

  }
}

InfoTable.propTypes = {
  btnLabel: PropTypes.string.isRequired,
  data: PropTypes.object
};

export default InfoTable;

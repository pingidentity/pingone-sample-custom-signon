import React from 'react';
import PropTypes from 'prop-types';

class UsernameValidator extends React.Component {
  constructor(props) {
    super();
    this.state = {
      username: props.username,
    };

    this.handleUsernameUpdate = this.handleUsernameUpdate.bind(this);
    this.doSubmit = this.doSubmit.bind(this);
    this.doCancel = this.doCancel.bind(this);
  }

  handleUsernameUpdate(event) {
    this.setState({username: event.target.value});
  }

  doSubmit(event) {
    event.preventDefault();
    const {username} = this.state;
    this.props.handleSubmit(username);
  }

  doCancel(event) {
    event.preventDefault();
    this.props.handleCancel();
  }

  render() {
    const {username} = this.state;
    const {children} = this.props;

    return (
        <div>
          {children}
          <form className="form" onSubmit={this.doSubmit}>
            <div className="input-field">
              <label>Username</label>
              <input
                  type="text"
                  className="text-input input-field"
                  id="username"
                  name="username"
                  placeholder="Username"
                  value={username}
                  onChange={this.handleUsernameUpdate}
                  autoFocus
              />
            </div>
            <div className="input-field">
              <button
                  className="button"
                  data-id="submit-btn"
                  disabled={!username}
                  type="submit"
              >
                Submit
              </button>
            </div>

            <div className="input-field">
              <button
                  className="button"
                  data-id="cancel-btn"
                  onClick={this.doCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
    );
  }
}

UsernameValidator.propTypes = {
  username: PropTypes.string,
  handleSubmit: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
};

UsernameValidator.defaultProps = {
  username: '',
  children: null,
};

export default UsernameValidator;

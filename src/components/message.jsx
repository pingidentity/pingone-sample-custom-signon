import React from 'react';
import PropTypes from 'prop-types';

const Message = ({ messageType, message }) => {
  return (
    <div>
      <div className={(messageType === "error" ? 'alert-danger' : 'alert-success' ) + ' alert'}>{message}</div>
    </div>
  );
};

Message.propTypes = {
  messageType: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

export default Message;

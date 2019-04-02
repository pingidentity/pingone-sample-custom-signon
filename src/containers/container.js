import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import actions from '../sdk/actions';
import Auth from '../components/auth';

const mapStateToProps = (state) => ({
  authState: _.get(state, 'auth', null)
});

const mapDispatchToProps = (dispatch) => ({
  authActions: actions.bind(dispatch),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Auth));


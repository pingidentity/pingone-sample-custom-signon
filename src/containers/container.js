import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import actions from '../sdk/actions';
import App from '../components/app';

const mapStateToProps = (state) => ({
  flowState: _.get(state, 'flow', null)
});

const mapDispatchToProps = (dispatch) => ({
  userActions: actions.bind(dispatch),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));


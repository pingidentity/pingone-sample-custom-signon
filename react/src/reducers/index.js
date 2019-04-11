import authActions from '../sdk/actions';

const initialState = {
  flow: null,
  message: { isError: false, content: null },
  isAuthenticated: false
};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case authActions.types.UPDATE_FLOW:
      return {
        ...state,
        flow: action.payload.result,
        isAuthenticated: action.payload.isAuthenticated,
        message: { content : action.payload.message }
      };

    case authActions.types.UNRECOVERABLE_ERROR:
      return {
        ...state,
        message: { isError: true, content : action.payload.error }
      };
    default:
      return state;
  }
};

export default {
  auth: reducer
};

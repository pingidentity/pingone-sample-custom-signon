import userActions from '../sdk/actions';

const initialState = {
  flow: null,
  message: { isError: false, content: null },
  isSubmitting: false,
  isAuthenticated: false
};

// userCredentials
const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case userActions.types.USER_SIGN_ON_SUCCESS:
      return {
        ...state,
        flow: action.payload.result,
        isAuthenticated: true
      };
    case userActions.types.USER_SIGN_ON_ERROR:
      return {
        ...state,
        isAuthenticated: false,
        flow: action.payload.result
      };

    case userActions.types.UPDATE_FLOW:
      return {
        ...state,
        flow: action.payload.result,
        isAuthenticated: action.payload.isAuthenticated
      };

    case userActions.types.UNRECOVERABLE_ERROR:
      return {
        ...state,
        message: { isError: true, content : action.payload.error }
      };
    default:
      return state;
  }
};

export default {
  flow: reducer
};

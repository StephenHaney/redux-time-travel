import { TIME_TRAVEL_BACKWARD, TIME_TRAVEL_FORWARD } from './timeTravelActions';

const timeTravelReducer = appReducers => (state, action) => {
  const appState = appReducers(state, action);

  switch (action.type) {
    case TIME_TRAVEL_BACKWARD:
    case TIME_TRAVEL_FORWARD:
      return {
        ...state,
        ...action.adjustedReality,
      };
    default:
      return appState;
  }
};

export default timeTravelReducer;

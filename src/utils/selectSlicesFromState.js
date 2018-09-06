/**
 * This function grabs the slices we care about from the state and returns an array
 * @param {redux state} state
 * @param {array of strings} slicesToWatch
 */
const selectSlicesFromState = (state, slicesToWatch) => {
  const selectedState = {};
  for (const sliceName of slicesToWatch) {
    selectedState[sliceName] = state[sliceName];
  }
  return selectedState;
};

export default selectSlicesFromState;

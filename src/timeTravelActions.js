/* Actions */
export const TIME_TRAVEL_BACKWARD = 'TIME_TRAVEL_BACKWARD';
export const TIME_TRAVEL_FORWARD = 'TIME_TRAVEL_FORWARD';
export const TIME_TRAVEL_RESET = 'TIME_TRAVEL_RESET';

/* Action creators */
export const timeTravelBackward = () => ({
  type: TIME_TRAVEL_BACKWARD,
});

export const timeTravelForward = () => ({
  type: TIME_TRAVEL_FORWARD,
});

export const timeTravelReset = () => ({
  type: TIME_TRAVEL_RESET,
});

import merger from './utils/merger';
import differ from './utils/differ';
import selectSlicesFromState from './utils/selectSlicesFromState';
import buildActionGroups from './utils/buildActionGroups';

import { TIME_TRAVEL_BACKWARD, TIME_TRAVEL_FORWARD, TIME_TRAVEL_RESET } from './timeTravelActions';

const NEWEST_HISTORY_INDEX = 0;
const FORWARD_IN_TIME = -1;
const BACKWARD_IN_TIME = 1;

/**
 * Creates the middleware function to keep track of diffs and store history
 *
 * @param {reducer} appReducers Your main store reducer function, usually combineReducers result
 * @param {array} slicesToWatch optional, array of strings, when provided will only take and save diffs from certain slices of the state
 * @param {array} actionsToIgnore optional, array of strings, with actions that should be ignored, not triggering diffs and time travel change history
 * @param {array} actionsToGroup optional, array of arrays, specify arrays of actions to group, example syntax: [[ONE_ACTION, ANOTHER_ACTION], [ACTION_5, ACTION_7]]. This will group these actions into the same change event in the history when they happen back-to-back, rather than creating a new change event. Currently, actions can exist in only one group.
 */
const createTimeTravelMiddleware = ({
  slicesToWatch = [],
  actionsToIgnore = [],
  actionsToGroup = [],
  maxHistoryLength = 25,
} = {}) => {
  // A cache for our previousState, to compare and diff against:
  let prevState = null;
  // Our array of history events, in a format: { change: object tree of diffs, revert: object tree of diffs, actionType: type of action that made the change }
  let history = [];
  // An index to represent our current point in history, 0 is the newest, infinity is the oldest:
  let currentHistoryIndex = NEWEST_HISTORY_INDEX;
  // lastHistoryDirection holds our momentum... so if we undo after and undo, we want to +1 our index and grab the revert.
  // If we redo after an undo, we want to use the same index as previous, but apply the change diff instead of the revert.
  let lastHistoryDirection = FORWARD_IN_TIME;
  // Build grouped actions as a hash map object for fast lookups:
  const groupedActions = buildActionGroups(actionsToGroup);
  // Build ignore actions as a Set for fast lookups:
  const ignoreActions = new Set(actionsToIgnore);

  return store => next => (action) => {
    switch (action.type) {
      case TIME_TRAVEL_BACKWARD:
      case TIME_TRAVEL_FORWARD: {
        // We'll build a new action for our reducer with an updated state:
        const newAction = { ...action };
        const directionIsBackward = action.type === TIME_TRAVEL_BACKWARD;
        // Establish our index modifier:
        const timeTravelDirection = directionIsBackward ? BACKWARD_IN_TIME : FORWARD_IN_TIME;
        // Find the new history index... if we're moving in the same direction as before, move a full index
        // If we're moving in a different direction, we want to stay on this index and use the opposite diff
        const timeTravelMomentum = lastHistoryDirection === timeTravelDirection;
        const newHistoryIndex = timeTravelMomentum ? currentHistoryIndex + timeTravelDirection : currentHistoryIndex;
        // useful debug:
        // console.log('-- about to merge');
        // console.log({ history });
        // console.log({ newHistoryIndex });

        // Make sure we've got a diff to move to:
        if (newHistoryIndex > -1 && newHistoryIndex < history.length) {
          // Update our history index and momentum tracker:
          lastHistoryDirection = timeTravelDirection;
          currentHistoryIndex = newHistoryIndex;
          // Find the history from that index and grab the change or revert diff to merge:
          const changeToMerge = history[newHistoryIndex];
          // Pull out the diffs from the change:
          // const diffsToMerge = changeToMerge.diffs.map(diff => (directionIsBackward ? diff.revert : diff.change));
          const diffToMerge = directionIsBackward ? changeToMerge.diff.revert : changeToMerge.diff.change;
          // useful debug:
          // console.log({ changeToMerge });
          // console.log({ diffToMerge });

          // Merge the diff into the new state and pack it into the action for the reducer to pick up:
          const state = store.getState();
          // We'll merge the diff into the slices we're watching, so we have a new prevState cache for the next action:
          const stateToMerge = slicesToWatch.length > 0 ? selectSlicesFromState(state, slicesToWatch) : state;
          for (const slice of Object.keys(stateToMerge)) {
            // for (const diffToMerge of diffsToMerge) {
            //   if (diffToMerge[slice]) {
            //     stateToMerge[slice] = merger(stateToMerge[slice], diffToMerge[slice]);
            //   }
            // }
            if (diffToMerge[slice]) {
              stateToMerge[slice] = merger(stateToMerge[slice], diffToMerge[slice]);
            }
          }

          newAction.adjustedReality = stateToMerge;
          // Update our prevState cache for the next action's diffing efforts:
          prevState = stateToMerge;
        }
        return next(newAction);
      }
      case TIME_TRAVEL_RESET: {
        prevState = null;
        history = [];
        currentHistoryIndex = NEWEST_HISTORY_INDEX;
        lastHistoryDirection = FORWARD_IN_TIME;
        return next(action);
      }
      default: {
        // This is a normal action, unrelated to a time travel request.
        // Calculate the diffs and update the history.

        // Send the original action through the reducers:
        const returnAction = next(action);

        // Performance check code:
        // console.log('start ' + action.type);
        // console.log(Date.now());

        // Grab the new app state:
        const nextState = store.getState();

        // Grab the state we care about potentially diffing:
        const nextStateToWatch = slicesToWatch.length > 0 ? selectSlicesFromState(nextState, slicesToWatch) : nextState;

        // If prevState is null, we don't have any previous state to compare against
        // just update our prevState cache with the new version for the next action
        // This is used to prevent undoing initial state, and allowing loading new data
        // without creating history:
        if (prevState === null) {
          prevState = nextStateToWatch;
          return returnAction;
        }
        // If the action type is in our ignore list, we can just cache the new state and we're done:
        if (ignoreActions.has(action.type)) {
          prevState = nextStateToWatch;
          return returnAction;
        }

        // useful debug:
        // console.log('-- about to diff');
        // console.log({ prevState });
        // console.log({ nextStateToWatch });

        // Find the diff:
        const diff = differ(prevState, nextStateToWatch);
        diff.actionType = action.type;

        // Update our previous state with the new version for the next go-round:
        prevState = nextStateToWatch;

        // Check if we have differences and, if so, dispatch save them to our history:
        if (diff !== null) {
          if (currentHistoryIndex !== 0 || lastHistoryDirection === BACKWARD_IN_TIME) {
            // We're currently in the past...
            // Chop off the abandoned future, insert our diff, and reset our current index

            // If the last move was backwards, we want to chop off the current index... otherwise we can include the current index in our new history
            const indexToSlice = lastHistoryDirection === BACKWARD_IN_TIME ? currentHistoryIndex + BACKWARD_IN_TIME : currentHistoryIndex;
            const newHistory = history.slice(indexToSlice);
            currentHistoryIndex = NEWEST_HISTORY_INDEX;
            lastHistoryDirection = FORWARD_IN_TIME;

            const newChange = {
              actions: new Set([action.type]),
              // diffs: [diff],
              diff,
            };
            history = [newChange, ...newHistory];
          } else {
            // We're already caught up...

            // Check the last diff to see if we should group this action with the last action
            let groupWithLastDiff = false;
            if (history.length > 0) {
              const previousChange = history[0];
              // Get the action group from the previous diff:
              const lastActionGroup = groupedActions[previousChange.diff.actionType] || null;

              // Check if the new action type shares a group with the previous action type:
              if (lastActionGroup !== null && lastActionGroup.has(action.type)) {
                groupWithLastDiff = true;
              }
              // Check if the action was already used in the previous group:
              if (previousChange.actions.has(action.type)) {
                groupWithLastDiff = false;
              }
            }

            if (groupWithLastDiff) {
              // The new diff should get grouped in with the last diff based on action groups.
              const changeToModify = history[0];

              // Add the new diff to the previous change's diffs:
              // changeToModify.diffs = [diff, ...changeToModify.diffs];
              changeToModify.diff = merger(diff, changeToModify.diff, { copyUndefined: true });
              // Add the new action to the actions set:
              changeToModify.actions.add(action.type);
            } else {
              // No special cases, insert our new diff into the history array:
              const newChange = {
                actions: new Set([action.type]),
                // diffs: [diff],
                diff,
              };
              history = [newChange, ...history];
            }
          }

          // Trim the history if it's at max length:
          if (history.length > maxHistoryLength) {
            history = history.slice(0, maxHistoryLength);
          }
        }

        // Performance check code:
        // console.log(Date.now());
        // console.log('end ' + action.type);

        // useful debug:
        // console.log({ history });

        // And we're done:
        return returnAction;
      }
    }
  };
};

export default createTimeTravelMiddleware;

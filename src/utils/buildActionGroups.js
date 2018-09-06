/**
 * Takes in an array of arrays of actions to group and returns a hashmap object with Sets of grouped action types
 * * Example input [[ACTION_1, ACTION_2]]
 * * Example return { ACTION_1: Set(1) { ACTION_2 }, ACTION_2: Set(1) { ACTION_1 } }
 *
 * Note that, as written, this is a very slow, time complex function.
 * This will need work if expected inputs grow in size,
 * or if it's ever used at a time-sensitive point in the app.
 * Right now, expected inputs are a few dozen at most and expected usage is during init.
 *
 * @param {array} actionsToGroup Array of arrays of actions to group together
 */
const buildActionGroups = (actionsToGroup) => {
  const returnMap = {};
  for (const group of actionsToGroup) {
    for (const action of group) {
      if (returnMap[action]) {
        // This action id already exists, meaning we're attempting to add it to more than one group:
        console.error('Error building action groups: actions can only belong to one group.');
      } else {
        // Add the action to the object with an Set of the other actions in the group:
        returnMap[action] = new Set(group.filter(otherAction => otherAction !== action));
      }
    }
  }

  return returnMap;
};

export default buildActionGroups;

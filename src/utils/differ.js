/* eslint-disable no-continue */

// Note: This is a deep diff for a proper Redux store, but not a proper deep diff
// Because this deals with redux state, it gets to assume certain things...
// Like only serializable data, no functions, data types don't change, etc

// I do check for Date objects, as the serializer will pick them up and handle them
// Although I wouldn't store a Date object in the redux store personally

// When comparing arrays, this will always take the entire array if they are different
const differ = (oldObj, newObj) => {
  // Check if objects are the same reference and return out fast:
  if (oldObj === newObj) {
    return {};
  }

  // Create our return object:
  const change = {};
  const revert = {};

  // Loop through old object and check for deleted items:
  for (const oldKey of Object.keys(oldObj)) {
    if (Object.prototype.hasOwnProperty.call(newObj, oldKey) === false) {
      revert[oldKey] = oldObj[oldKey];
      change[oldKey] = undefined;
    }
  }

  // Loop through newKeys and compare values against old:
  for (const newKey of Object.keys(newObj)) {
    const newVal = newObj[newKey];
    const oldVal = oldObj[newKey];

    // Check if there is strict equality and continue if so:
    if (newVal === oldVal) {
      continue;
    }

    // Check if this is a brand new field and if so, set undefined for this revert:
    if (typeof oldVal === 'undefined') {
      revert[newKey] = undefined;
      change[newKey] = newVal;
      continue;
    }

    // Check if new value is an object (ignoring nulls which will get picked up by normal comparison logic)
    if (typeof newVal === 'object' && newVal !== null) {
      // Check for array:
      if (newVal.constructor === Array) {
        // Check if the arrays are different:
        const arrayEquality = differ(oldVal, newVal);
        if (arrayEquality !== null) {
          // If the arrays are different, grab the whole array and continue:
          revert[newKey] = [...oldVal];
          change[newKey] = [...newVal];
          continue;
        }
      }

      // Check for date differences:
      if (newVal instanceof Date) {
        if (newVal.valueOf() !== oldVal.valueOf()) {
          revert[newKey] = oldVal;
          change[newKey] = newVal;
          continue;
        }
      }

      // Not dates or arrays, recursively search these true objects:
      const recursiveObjDiffs = differ(oldVal, newVal);
      if (recursiveObjDiffs !== null) {
        revert[newKey] = recursiveObjDiffs.revert;
        change[newKey] = recursiveObjDiffs.change;
        continue;
      }
    }

    // If we're this far, we have two non-objects that aren't strictly equal, so grab their vals:
    revert[newKey] = oldVal;
    change[newKey] = newVal;
  }

  if (Object.keys(change).length > 0 || Object.keys(revert).length > 0) {
    return { change, revert };
  }
  return null;
};

export default differ;

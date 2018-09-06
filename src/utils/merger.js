/* eslint-disable no-continue */

/**
 * Helper function that returns true for simple objects and false for plain values, nulls, and dates.
 * It ignores functions since functions are not serializable and wouldn't be in a redux state.
 *
 * @param {any} value
 * @returns {bool}
 */
const isPlainObject = value => typeof value === 'object' && value !== null && value.constructor !== Array && value instanceof Date === false;

/**
 * Merges a source over top of a destination
 *
 * Source arrays, dates, and values always win and replace any destination value
 * Source objects are recursively merged in
 *
 * Undefined - Source keys that are present but 'undefined', by default,
 * will result in the complete removal of the property from the
 * returned merge. Set copyUndefined to true to copy over these values.
 *
 * Destination keys that are objects without a corresponding source object are copied by reference (no deep copy)
 *
 * Returned merged object is a new object, at least a shallow copy, to faciliate the removal of properties without using delete
 *
 * @param {object} destination
 * @param {object} source
 * @param {object} options copyUndefined forces the merger to copy over undefined source values into the merged object
 */
const opinionatedDeepMerger = (destination, source, { copyUndefined = false } = {}) => {
  const mergedCopy = {};

  // If destination doesn't exist, just copy over the source values
  // (new sourceKey with object value can cause this in recursion)
  if (typeof destination === 'undefined') {
    return source;
  }

  // Loop through source object and check for new items:
  for (const sourceKey of Object.keys(source)) {
    if (Object.prototype.hasOwnProperty.call(destination, sourceKey) === false) {
      mergedCopy[sourceKey] = source[sourceKey];
    }
  }

  // Loop through destination and look for new values to pull in:
  for (const [key, value] of Object.entries(destination)) {
    if (Object.prototype.hasOwnProperty.call(source, key) === false) {
      // There is no source value to merge, just copy over the destination value:
      mergedCopy[key] = value;
    } else {
      // The source object has a replacement value to merge in, use it instead:
      const sourceValue = source[key];

      if (typeof sourceValue === 'undefined' && copyUndefined === false) {
        // undefined value with copyUndefined flag at false... delete the key from the merged object
        // we achieve this by simply not copying any value for this key to the new merged copy
        continue;
      }

      // Check if source value is an object (ignoring nulls which will get picked up by normal merge logic)
      if (isPlainObject(sourceValue)) {
        // Not dates or arrays, recursively merge these true objects:
        mergedCopy[key] = opinionatedDeepMerger(value, sourceValue, { copyUndefined });
        continue;
      }

      // If we're this far, it's not undefined or an object and can be copied in directly:
      mergedCopy[key] = sourceValue;
    }
  }

  return mergedCopy;
};

export default opinionatedDeepMerger;

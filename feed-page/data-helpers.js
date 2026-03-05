/**
 * O(n) way of getting the most recent elements from a map
 * efficient for small values of count relative to large arrays
 * @param array
 * @param timestampKey
 * @param count
 * @returns Sorted-sub of length "count" with the elements that have the most recent timestamps
 */
export function getRecentElementsFromArray(array, timestampKey, count) {
  const recentValues = [];
  let leastRecentTimestamp = 0;
  if (count <= 0) {
    return recentValues;
  }

  array.forEach((value) => {
    const timeStamp = value[timestampKey];
    if (timeStamp && timeStamp > leastRecentTimestamp) {
      // Find the correct position to insert the value
      const insertIndex = recentValues.findIndex(
        (value) => value[timestampKey] < timeStamp
      );

      if (insertIndex === -1) {
        // If no earlier timestamp found, append to end
        recentValues.push(value);
      } else {
        // Insert at the correct position
        recentValues.splice(insertIndex, 0, value);
      }

      if (recentValues.length > count) {
        // keep only the n most recent
        recentValues.pop();
        leastRecentTimestamp = recentValues[count - 1][timestampKey];
      }
    }
  });

  return recentValues;
}

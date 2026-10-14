// Copies only the listed keys that are present on `source`. Used to stop mass assignment.
module.exports = (source = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

var _u = require("underscore");

function _depth(obj, str, val, change) {
  if (typeof obj === "undefined" || obj == null) return val;
  if (typeof str === "string") return _depth(obj, str.split("."), val, change);
  var f = str.shift();
  var nobj = obj[f];
  var not_defined = typeof nobj === "undefined";
  if (change === true) {
    if (str.length) {
      if (not_defined) nobj = obj[f] = {};
    } else {
      return obj[f] = val;
    }
  }
  if (str.length) return _depth(nobj, str, val, change);
  return not_defined ? val : nobj;
}

function _defaultOrSet(obj, str, val) {
  if (typeof str === "string") return _defaultOrSet(obj, str.split("."), val);
  var f = str.shift();
  var nobj = obj[f];
  if (str.length) {
    return _defaultOrSet(typeof nobj === "undefined" ? obj[f] = nobj = {} : nobj, str, val);
  }
  return typeof nobj == "undefined" ? obj[f] = val : obj[f];
}

function _options(obj) {
  return _value(obj, "options", {});
}

function _value(obj, key, def) {
  return _depth(obj, key, def, false);
}

function flatten(obj, includePrototype, into, prefix) {
  into = into || {};
  prefix = prefix || "";
  for (var k in obj) {
    if (includePrototype || obj.hasOwnProperty(k)) {
      var prop = obj[k];
      if (prop && typeof prop === "object" && prop.subSchema && !(prop instanceof Date || prop instanceof RegExp)) {
        flatten(prop.subSchema || prop, includePrototype, into, prefix + k + ".");
      } else {
        into[prefix + k] = prop;
      }
    }
  }
  return into;
}

module.exports = {
  defaultOrSet: _defaultOrSet,
  depth: _depth,
  value: _value,
  options: _options,
  inherits: require("util").inherits,
  flatten: flatten
};

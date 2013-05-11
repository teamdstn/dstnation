var FlatMatcher = function () {
    var getMatchObj = function (matchArgs) {
        var isArray = function (value) {
            return Object.prototype.toString.apply(value) === "[object Array]";
          };
        var buildMatcherLookup = function (pathString, tree, matcherLookup, depth) {
            if (depth > maxDepth) {
              return matcherLookup;
            }
            depth += 1;
            var MatcherLookupEntry = function (p, c, a) {
                return {
                  pathString: p,
                  caster: c,
                  isArray: a
                };
              };
            var makeLookupEntry = function (prop, pathString, caster, isArrayVal) {
                var entry = MatcherLookupEntry(pathString, caster, isArrayVal);
                if (!matcherLookup.hasOwnProperty(prop)) {
                  matcherLookup[prop] = entry;
                } else {
                  matcherLookup[pathString] = entry;
                }
              };
            var isArray = function (value) {
                return Object.prototype.toString.apply(value) === "[object Array]";
              };
            var isFunction = function (value) {
                return typeof value === "function";
              };
            var isObject = function (value, literal) {
                var type = typeof value,
                  test = !! value && type === "object";
                return test && literal ? value.constructor === Object : test;
              };
            var isMongooseSchema = function (v) {
                return isObject(v) && v.hasOwnProperty("paths") && v.hasOwnProperty("tree");
              };
            var mongooseSchemaTreeEquals = function (s1, s2) {
                var objLen = function (o) {
                    var l = 0;
                    for (prop in o) {
                      l += 1;
                    }
                    return l;
                  };
                var isSamePropertyVal = function (pv1, pv2) {
                    if (isArray(pv1) && isArray(pv2) || isFunction(pv1) && isFunction(pv2) || isObject(pv1) && isObject(pv2) || isMongooseSchema(pv1) && isMongooseSchema(pv2)) {
                      return true;
                    }
                    return false;
                  };
                var l1, l2;
                if ((l1 = objLen(s1)) !== (l2 = objLen(s2))) {
                  return false;
                }
                for (prop in s1) {
                  if (!prop in s2) {
                    return false;
                  } else if (!isSamePropertyVal(s1[prop], s2[prop])) {
                    return false;
                  }
                }
                return true;
              };
            var noOpCaster = function (value) {
                return value;
              };
            var propVal = null;
            var curPathString = pathString;
            var isArrayVal = false;
            var literal = 1;
            for (prop in tree) {
              pathString = curPathString;
              if (pathString.length > 0) {
                pathString += ".";
              }
              pathString += prop;
              propVal = tree[prop];
              if (isArrayVal = isArray(propVal)) {
                if (propVal.length === 0) {
                  makeLookupEntry(prop, pathString, noOpCaster, isArrayVal);
                  continue;
                } else {
                  propVal = propVal[0];
                }
              }
              if (isFunction(propVal, literal)) {
                makeLookupEntry(prop, pathString, propVal, isArrayVal);
              } else if (isMongooseSchema(propVal)) {
                if (isArrayVal) {
                  makeLookupEntry(prop, pathString, noOpCaster, isArrayVal);
                }
                if (mongooseSchemaTreeEquals(tree, propVal.tree) && depth < maxDepth) {
                  depth = maxDepth;
                }
                matcherLookup = buildMatcherLookup(pathString, propVal.tree, matcherLookup, depth);
              } else if (isObject(propVal)) {
                if (isArrayVal) {
                  makeLookupEntry(prop, pathString, noOpCaster, isArrayVal);
                }
                matcherLookup = buildMatcherLookup(pathString, propVal, matcherLookup, depth);
              }
            }
            return matcherLookup;
          };
        var pathString = "";
        var matcherLookup = {};
        var depth = 0;
        matcherLookup = buildMatcherLookup(pathString, this.tree, matcherLookup, depth);
        var matchObj = {};
        var propVal = null;
        var mlEntry = null;
        var j = 0;
        for (prop in matchArgs) {
          if (matcherLookup.hasOwnProperty(prop)) {
            propVal = matchArgs[prop];
            mlEntry = matcherLookup[prop];
            if (mlEntry.isArray) {
              if (isArray(propVal)) {
                for (j = 0; j < propVal.length; j += 1) {
                  propVal[j] = mlEntry.caster(propVal[j]);
                }
                matchObj[mlEntry.pathString] = {
                  $in: propVal
                };
              } else {
                matchObj[mlEntry.pathString] = mlEntry.caster(propVal);
              }
            } else {
              matchObj[mlEntry.pathString] = mlEntry.caster(propVal);
            }
          }
        }
        return matchObj;
      };
    var maxDepth = 5;
    var getMaxDepth = function () {
        return maxDepth;
      };
    var setMaxDepth = function (depth) {
        maxDepth = depth;
      };
    return {
      plugin: function (schema, opts) {
        schema["getMatchObj"] = getMatchObj;
        schema.getMatchObj.tree = schema.tree;
        schema["setMaxDepth"] = setMaxDepth;
        schema["getMaxDepth"] = getMaxDepth;
      }
    };
  }();

exports.plugin = FlatMatcher.plugin;

var cycle = exports;

cycle.decycle = function decycle(object) {
  "use strict";
  var objects = [],
    paths = [];
  return function derez(value, path) {
    var i, name, nu;
    switch (typeof value) {
    case "object":
      if (!value) {
        return null;
      }
      for (i = 0; i < objects.length; i += 1) {
        if (objects[i] === value) {
          return {
            $ref: paths[i]
          };
        }
      }
      objects.push(value);
      paths.push(path);
      if (Object.prototype.toString.apply(value) === "[object Array]") {
        nu = [];
        for (i = 0; i < value.length; i += 1) {
          nu[i] = derez(value[i], path + "[" + i + "]");
        }
      } else {
        nu = {};
        for (name in value) {
          if (Object.prototype.hasOwnProperty.call(value, name)) {
            nu[name] = derez(value[name], path + "[" + JSON.stringify(name) + "]");
          }
        }
      }
      return nu;

    case "number":
    case "string":
    case "boolean":
      return value;
    }
  }(object, "$");
};

cycle.retrocycle = function retrocycle($) {
  "use strict";
  var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;
  (function rez(value) {
    var i, item, name, path;
    if (value && typeof value === "object") {
      if (Object.prototype.toString.apply(value) === "[object Array]") {
        for (i = 0; i < value.length; i += 1) {
          item = value[i];
          if (item && typeof item === "object") {
            path = item.$ref;
            if (typeof path === "string" && px.test(path)) {
              value[i] = eval(path);
            } else {
              rez(item);
            }
          }
        }
      } else {
        for (name in value) {
          if (typeof value[name] === "object") {
            item = value[name];
            if (item) {
              path = item.$ref;
              if (typeof path === "string" && px.test(path)) {
                value[name] = eval(path);
              } else {
                rez(item);
              }
            }
          }
        }
      }
    }
  })($);
  return $;
};

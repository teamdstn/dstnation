var pt = require("path");

module.exports = function instance(instance, options) {
  instance = require("edge/modules/"+instance);

  typeof instance === "function" && (instance=instance(options.m, options))
  var _tp = options.type || "pass", _routes = options.routes || null;
  ;//================================
  _routes && (_routes = _routes && Object(_routes) === _routes ? _routes : require(pt.resolve(_routes)));
  handler = typeof _tp === "string" ? handlers[_tp].apply(instance, [options]) : _tp;
  function __instance(routes, core) {
    return {
      __mounted: function(app) {
        instance.initialize(app ,core);
        instance.route && "function" === typeof instance.route && (instance.route(app ,core));
        routes && (routes(app, instance));
      },
      handle: handler,
      set: function (nested, path) {
        __instance[nested] = path;
      },
      emit: function (evt, app) {
        evt === "mount" && (this.__mounted(app));
      }
    };
  };

  return __instance(_routes||null, this);
}

var handlers = {};

handlers.session = function (options) {
  var __i = this, name = "_"+(options.name || __i.name), _then = options.then
  ;//================================
  typeof _then === "string" && (_then = __i[_then]());

  return function (req, res, next) {
    req[name] = {};
    req[name].instance = __i;
    if (req.session && req.session[__i._key]) {
      req[name].session = req.session[__i._key];
    } else if (req.session) {
      req.session[__i._key] = {};
      req[name].session = req.session[__i._key];
    } else {
      req[name].session = {};
    }
    _then ? _then(req, res, next) : next();
  }
}

handlers.pass = function () {
  return function (req, res, next) {
    next();
  }
}
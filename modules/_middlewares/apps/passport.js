module.exports = function instance(instance, options) {
  var _tp = options.type || "pass"
  ;//================================
  handler = typeof _tp === "string" ? handlers[_tp].apply(instance, [options]) : _tp;

  function __instance(routes) {
    return {
      __mounted: function(app) {
        instance.initialize && (instance.initialize());
        routes && (routes(app, instance));
      },
      handle: handler,
      set: function (nested, path) {
        self[nested] = path;
      },
      emit: function (evt, app) {
        evt === "mount" && (this.__mounted(app));
      }
    };
  };
  return __instance(options.routes||null);
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
var pt  = require("path")
  , $u  = require("underscore")
  , static  = require("connect/lib/middleware/static")



;//================================================
var cleanRe = /([\/]*)?(.*)([\/]*)?/;

function cleanurl(str) {
  return str && str.replace(/(^[\/]*)/, "").replace(/\/{2,}/, "/").replace(/([\/]*)$/, "/");
}

var Plugin = function (options, app, name, p, pluginManager) {
    this.pluginManager = pluginManager;
    this.path = p;
    this.options = $u.extend({}, options);
    var _baseUrl;
    this.__defineSetter__("baseUrl", function (val) {
      _baseUrl = val == "/" ? val : val && "/" + cleanurl(val) || "/";
    });
    this.baseUrl = this.options.baseUrl;
    this.name = name || this.options.name || pt.basename(pt.dirname(module.parent.filename));
    this.__defineGetter__("baseUrl", function () {
      var ret = _baseUrl;
      return ret;
    });
    this.app = app;
  };

Plugin.prototype.configure = function (conf, req) {};

Plugin.prototype.__defineGetter__("pluginUrl", function () {
  var ret = this.options.pluginUrl || this.baseUrl + this.name;
  return ret;
});

Plugin.prototype.appModel = function () {};

Plugin.prototype.save = function onPluginSave(conf, callback, req) {
  this.pluginManager.save(this, conf, callback, req);
};

Plugin.prototype.defaultEngine = "jqtpl";

Plugin.prototype.filters = function (options) {
  var sdir  = pt.join(this.path, "public");

  var psdir = pt.join(this.path, "../../", "public/plugins", this.name);

  var public      = static(sdir);
  var publicUser  = static(psdir);

  this.app.all(this.pluginUrl + "*", function (req, res, next) {
    res.locals["pluginUrl"] = this.pluginUrl;
    res.locals["baseUrl"]   = this.baseUrl;
    next();
  }.bind(this));

  this.app.get(this.baseUrl + "js/libs/editors/*", function (req, res, next) {
    req._url = req.url, req.url = req.url.substring(this.baseUrl.length), next();
  }.bind(this), public, publicUser, function (req, res, next) {
    req.url = req._url, next();
  });

  this.app.get(this.pluginUrl + "*", function (req, res, next) {
    req._url = req.url, req.url = req.url.substring(this.pluginUrl.length), next();
  }.bind(this), public, publicUser, function (req, res, next) {
    req.url = req._url, next();
  });
};

Plugin.prototype.routes = function (routes) {
  var prefix = this.pluginUrl;
  this.app.get(prefix + "*", function (req, res, next) {
    this.generate(res, req.url.substring(prefix.length));
  }.bind(this));
  var jsView = this.baseUrl + "js/views/" + this.name;
  this.app.get(jsView + "/*", function (req, res, next) {
    var view = req.url.substring(jsView.length);
    res.locals["pluginUrl"] = this.pluginUrl;
    this.generate(res, view);
  }.bind(this));
};

Plugin.prototype.editors = function () {
  return [];
};

Plugin.prototype.editorFor = function (path, property, model) {};

Plugin.prototype.admin = function (admin) {};

Plugin.prototype.generate = function (res, view, options, next) {
  var search = pt.join(this.path, "/views/", view);
  res.render(search, $u.extend({
    relative: false,
    hint: true
  }, options, {
    layout: false,
    defaultEngine: this.defaultEngine,
    pluginUrl: this.pluginUrl
  }));
};

module.exports = Plugin;

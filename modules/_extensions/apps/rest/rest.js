var Plugin  = require("../proto")
  , util    = require("../util")
  , _u      = require("underscore")


var splits = exports.splits = function (val, delim, ret) {
  ret = ret || [];
  delim = delim || ",";
  if (!val) return ret;
  if (Array.isArray(val)) {
    val.forEach(function (v) { splits(v, delim, ret); });
  } else {
    val.split(delim).forEach(function (v) {
      ret.push(v);
    });
  }
  return ret;
};

var RestPlugin = function () {
    Plugin.apply(this, arguments);
    if (!this.options.apiUrl) this.options.apiUrl = this.baseUrl + "rest";
  };

util.inherits(RestPlugin, Plugin);

RestPlugin.prototype.filters = function () {
  this.app.all(this.options.apiUrl + "/*", function (req, res, next) {
    req.query.transform = splits(req.query.transform, ",", ["_idToId"]);
    next();
  });
};

RestPlugin.prototype.routes = function () {
  var options = this.options;
  var pluginManager = this.pluginManager;
  var mers = options.mers || require("mers");

  this.app.use( options.apiUrl, mers(_u.extend({}, options, {
    transformers: {
      labelval: function (m) {
        var model = pluginManager.appModel.modelFor(m.modelName);
        var labelAttr = model && model.labelAttr;
        return function (obj) {
          return {
            val: obj._id || obj.id,
            label: labelAttr && obj[labelAttr] ? obj[labelAttr] : m.modelName + "[" + (obj.id || obj._id) + "]"
          };
        };
      },
      _idToId: function (M) {
        return function (obj) {
          if (!obj) return null;
          var o = obj.toObject ? obj.toObject() : obj;
          o.id = obj._id;
          delete o._id;
          return o;
        };
      }
    }
  })).rest());
};

module.exports = RestPlugin;

var pt = require("path"),
  fs  = require("fs"),
  $u = require("underscore"),
  DisplayModel = require("./DisplayModel"),
  Plugin = require("./index"),
  FilePersistence = require("./FilePersistence");
var PluginManager = function (options, express) {
  this.options    = $u.extend({}, options);
  this.configFile = this.options.configFile || pt.join(process.cwd(), "conf", "extension.json");
  this.persist    = options.persist || new FilePersistence(this.configFile);
  this.plugins    = this.loadPlugins(this.options, express);
  this.appModel   = new DisplayModel(this.options);
  this.loadAppModels();
  this.loadFilters();
  this.loadRoutes();
  this.configure();
};
PluginManager.prototype.save = function (plugin, data, callback, req) {
  this.persist.save(plugin.name, data, callback, req);
};
PluginManager.prototype.configure = function (req) {
  var obj = this.persist.read(this.configFile, req);
  if (obj && obj.plugins) this.plugins.forEach(function (plugin) {
    plugin.configure(obj.plugins[plugin.name]);
  }, this);
};
PluginManager.prototype.defaultPlugins = ["static", "appeditor", "modeleditor", "less", "generator", "rest", "mongoose", "package"];
PluginManager.prototype.__defineGetter__("admin", function () {
  var admin = [];
  this.plugins.forEach(function (plugin) {
    var adm = plugin.admin(this.options);
    adm !== void 0 && (admin = admin.concat(adm));
  }, this);
  return admin;
});
PluginManager.prototype.__defineGetter__("editors", function () {
  var editors = [];
  this.plugins.forEach(function (plugin) {
    var edit = plugin.editors();
    if (edit) editors = editors.concat(edit);
  }, this);
  return editors;
});
PluginManager.prototype.loadFilters = function () {
  this.plugins.forEach(function (plugin) {
    plugin.filters(this.options);
  }, this);
};
PluginManager.prototype.loadAppModels = function () {
  this.plugins.forEach(function (plugin) {
    this.appModel.add(plugin.appModel(this.options));
  }, this);
};
PluginManager.prototype.loadRoutes = function () {
  this.plugins.forEach(function (plugin) {
    plugin.routes(this.options);
  }, this);
};
function isPluginApi(cls) {
  var _super = cls._super;
  while (_super) {
    if (_super === Plugin) return true;
    _super = _super._super;
  }
  return false;
}
PluginManager.prototype.loadPlugins = function (options, express) {
  var defDirs = [pt.join(pt.dirname(module.filename)+"s", "apps"), options.pluginDir];
  console.log(defDirs);
  var dirs = options.pluginDirs || options.pluginDir && [].concat(options.pluginDir).concat(defDirs) || defDirs;
  var plugins = options.plugins || options.plugin && [].concat(options.plugin).concat(this.defaultPlugins) || this.defaultPlugins;
  if (options.extraPlugins) {
    plugins = plugins.concat(options.extraPlugins);
  }
  var loaded = {};
  var ret = [];
  $u.unique(plugins).forEach(function (pdir) {
    if ($u.isFunction(pdir)) {
      var plugin = isPluginApi(pdir) ? new pdir(options, express, null, null, this) : pdir(options, express, null, null, this);
      ret.push(plugin);
      loaded[plugin.name || pdir] = true;
    } else {
      if (loaded[pdir]) return console.warn("plugin already loaded [" + pdir + "]");
      $u.unique(dirs).forEach(function (dir) {
        if (!fs.existsSync(dir)) return;
        var fpath = pt.join(dir, pdir, pdir + ".js");
        if (fs.existsSync(fpath)) {
          console.log("loading ", fpath);
          try {
            var Plugin = require(fpath);
            var plugin = new Plugin(options, express, pdir, pt.join(dir, pdir), this);
            ret.push(plugin);
            loaded[pdir] = true;
          } catch (e) {
            console.warn("error loading plugin [" + fpath + "]", e);
          }
        }
      }, this);
    }
  }, this);
  $u(plugins).difference(Object.keys(loaded)).forEach(function (v, k) {
    console.warn("did not load plungin [" + v + "]");
  });
  return ret;
};
PluginManager.prototype.pluginFor = function (path, property, object) {
  for (var i = 0, l = this.plugins.length; i < l; i++) {
    var field = this.plugins[i].editorFor(path, property, object);
    if (field) {
      return field;
    }
  }
};
PluginManager.prototype.pluginNames = function () {
  return $u(this.plugins).map(function (plugin) {
    return plugin.name;
  });
};
module.exports = PluginManager;

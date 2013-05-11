var path = require("path"),
  _u = require("underscore"),
  DisplayModel = require("./display-model"),
  PluginApi = require("./plugin-api"),
  FilePersistence = require("./file-persistence");

function merge(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; };
function create(options, express) {

  function instance() {

  }
  merge(instance, proto);

  instance.options = _u.extend({}, options);
  instance.configFile = this.options.configFile || path.join(process.cwd(), "conf", "bobamo.json");
  instance.persist = options.persist || new FilePersistence(this.configFile);
  instance.plugins = instance.loadPlugins(instance.options, express);
  instance.appModel = new DisplayModel(this.options);
  instance.loadAppModels();
  instance.loadFilters();
  instance.loadRoutes();
  instance.configure();
  return instance;
};


var proto = {};
proto.save = function (plugin, data, callback, req) {
  this.persist.save(plugin.name, data, callback, req);
};
proto.configure = function (req) {
  var obj = this.persist.read(this.configFile, req);
  if (obj && obj.plugins) this.plugins.forEach(function (plugin) {
    plugin.configure(obj.plugins[plugin.name]);
  }, this);
};
proto.defaultPlugins = ["static", "appeditor", "modeleditor", "less", "generator", "rest", "mongoose", "package"];

proto.__defineGetter__("admin", function () {
  var admin = [];
  this.plugins.forEach(function (plugin) {
    var adm = plugin.admin(this.options);
    if (!_u.isUndefined(adm)) admin = admin.concat(adm);
  }, this);
  return admin;
});

proto.__defineGetter__("editors", function () {
  var editors = [];
  this.plugins.forEach(function (plugin) {
    var edit = plugin.editors();
    if (edit) editors = editors.concat(edit);
  }, this);
  return editors;
});

proto.loadFilters = function () {
  this.plugins.forEach(function (plugin) {
    plugin.filters(this.options);
  }, this);
};

proto.loadAppModels = function () {
  this.plugins.forEach(function (plugin) {
    this.appModel.add(plugin.appModel(this.options));
  }, this);
};

proto.loadRoutes = function () {
  this.plugins.forEach(function (plugin) {
    plugin.routes(this.options);
  }, this);
};

function isPluginApi(clz) {
  var _super = clz._super;
  while (_super) {
    if (_super == PluginApi) return true;
    _super = _super._super;
  }
  return false;
}
proto.loadPlugins = function (options, express) {
  var defDirs = [path.join(path.dirname(module.filename), "../plugins"), path.join(process.cwd(), "../plugins")];
  var dirs = options.pluginDirs || options.pluginDir && [].concat(options.pluginDir).concat(defDirs) || defDirs;
  var plugins = options.plugins || options.plugin && [].concat(options.plugin).concat(this.defaultPlugins) || this.defaultPlugins;
  if (options.extraPlugins) {
    plugins = plugins.concat(options.extraPlugins);
  }
  var loaded = {};
  var ret = [];
  _u.unique(plugins).forEach(function (pdir) {
    if (_u.isFunction(pdir)) {
      var plugin = isPluginApi(pdir) ? new pdir(options, express, null, null, this) : pdir(options, express, null, null, this);
      ret.push(plugin);
      loaded[plugin.name || pdir] = true;
    } else {
      if (loaded[pdir]) {
        console.warn("plugin already loaded [" + pdir + "]");
        return;
      }
      _u.unique(dirs).forEach(function (dir) {
        if (!path.existsSync(dir)) {
          return;
        }
        var fpath = path.join(dir, pdir, pdir + ".js");
        if (path.existsSync(fpath)) {
          console.log("loading ", fpath);
          try {
            var Plugin = require(fpath);
            var plugin = new Plugin(options, express, pdir, path.join(dir, pdir), this);
            ret.push(plugin);
            loaded[pdir] = true;
          } catch (e) {
            console.warn("error loading plugin [" + fpath + "]", e);
          }
        }
      }, this);
    }
  }, this);
  _u(plugins).difference(Object.keys(loaded)).forEach(function (v, k) {
    console.warn("did not load plungin [" + v + "]");
  });
  return ret;
};

proto.pluginFor = function (path, property, object) {
  for (var i = 0, l = this.plugins.length; i < l; i++) {
    var field = this.plugins[i].editorFor(path, property, object);
    if (field) {
      return field;
    }
  }
};

proto.pluginNames = function () {
  return _u(this.plugins).map(function (plugin) {
    return plugin.name;
  });
};

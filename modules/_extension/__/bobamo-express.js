var pt = require("path")
  , _u = require("underscore")
  , PluginManager = require("./plugin-manager")
  , engines = require("consolidate")
;//===========================================
exports = module.exports = bobamo;

function bobamo(options, express) {
  var options = _u.extend(this, options);
  if (options.uri) {
    if (!options.mongoose) {
      options.mongoose = require("mongoose");
      console.warn("using bobamo mongoose, you are better off supplying your own");
    }
    options.mongoose.createConnection(options.uri);
  }
  if (!options.mongoose) throw new Error("no mongoose or mongoose uri defined");

  var pdir = pt.join(pt.resolve(), "plugins");

  console.log(pdir);
  console.log("bobamo plugins", pdir);

  return {
    __mounted: function (app) {
      var base = options.basepath || (options.basepath = "");
      app.engine("html", engines.jqtpl);
      app.engine("js", engines.jqtpl);
      options.baseUrl = "/" + pt.basename(base);
      if (!options.pluginDir) options.pluginDir = pdir;
      new PluginManager(options, app);
      console.log("mounted bobamo on ", base);
    },
    handle: function (req, res, next) {
      next();
    },
    set: function (base, path) {
      options[base] = path;
    },
    emit: function (evt, app) {
      evt === "mount" && this.__mounted(app);
    }
  };
}

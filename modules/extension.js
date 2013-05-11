;//   $0 : { ───────────────────────────
var EventEmitter = require("events").EventEmitter
  , pt = require("path")
  , fs = require("fs")
  , proto
;//}, $1 : { ───────────────────────────
var mds = "./_plugins/lib/api".split(" ")
;//}, $2 : { ───────────────────────────
exports = module.exports = create;
exports.version = "0.0.0"
;//}, $3 : { ───────────────────────────

function create(options) {
  options = options || {};
  function instance(options){

    return instance;
  };
  for (var k in proto) instance[k] = proto[k];





  instance.options = {};
  instance.options.mongoose = require("mongoose");
  instance.options.mongoose.createConnection("mongodb://localhost/" + (options.dbnm || "edge2"));


  instance.options.uri = "mongodb://localhost/edge2";
  instance.options.basepath   = options.basepath || "";
  instance.options.pluginDir  = options.pdir || pt.join(process.cwd(), "plugin");
  instance.options.baseUrl    = "";
  return instance;
}

var proto = {};
proto.initialize=function(app){
  var pi = require("./_extension/PluginManager");
  new pi(this.options, app);
}

proto.route=function(){

}


/*
var pt = require("path")
  , _u = require("underscore")
  , PluginManager = require("./plugin-manager")
  , engines = require("consolidate")
;//===========================================
exports = module.exports = extension;


function extension(options, express) {
  //var options = _u.extend(this, options);
  options = options || {};
  var odm = options.odm || require("mongoose");
  odm.createConnection();
  odm.odm.open("mongodb://localhost/" + options.dbnm);
  odm.odm.once("connected", function () { console.info("conn"); });

  var pdir = Array.isArray(options.path) ? pt.join.apply(pt, options.path) ? options.path;

  console.log(pdir);
  console.log("extension plugins", pdir);

  return {
    __mounted: function (app) {
      var base = options.basepath || (options.basepath = "");
      app.engine("html", engines.jqtpl);
      app.engine("js", engines.jqtpl);
      options.baseUrl = "/" + pt.basename(base);
      if (!options.pluginDir) options.pluginDir = pdir;
      new PluginManager(options, app);
      console.log("mounted extension on ", base);
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

*/
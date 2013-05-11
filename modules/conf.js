var fs        = require("fs")
  , common    = require("./_conf/common")
  , Provider  = require("./_conf/provider").Provider
;

conf = module.exports = new Provider()
conf.key            = common.key;
conf.path           = common.path;
conf.loadFiles      = common.loadFiles;
conf.loadFilesSync  = common.loadFilesSync;
conf.formats        = require("./_conf/formats");
conf.Provider       = Provider;

fs.readdirSync(__dirname + "/_conf/stores").forEach(function(file) {
  var store = file.replace(".js", ""), name = common.capitalize(store);
  conf.__defineGetter__(name, function() {
      return require("./_conf/stores/" + store)[name];
  });
});
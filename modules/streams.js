var fs = require("fs");
var basename = require("path").basename;

fs.readdirSync(__dirname + "/_stream").forEach(function(filename) {
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, ".js");
    function load() {
      return require("./_stream/" + name);
    }
    exports.__defineGetter__(name, load);
});
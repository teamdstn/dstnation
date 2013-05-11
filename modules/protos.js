var fs = require("fs");
var basename = require("path").basename;

fs.readdirSync(__dirname + "/_proto").forEach(function(filename) {
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, ".js");
    function load() {
      return require("./_proto/" + name);
    }
    exports.__defineGetter__(name, load);
});
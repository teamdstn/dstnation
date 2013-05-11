//[] :______________________________
var fs = require("fs"), bn = require("path").basename;
(function(nm){nm="_"+nm;fs.readdirSync(__dirname+"/"+nm).forEach(function(f){function d(){return require("./"+nm+"/"+c)}if(/\.js$/.test(f)){var c=bn(f,".js");exports.__defineGetter__(c,d)}})})
("parsers")
;//_________________________________

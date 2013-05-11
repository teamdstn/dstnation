;//   $0 : { ───────────────────────────
var EventEmitter = require("events").EventEmitter
  , pt = require("path")
  , fs = require("fs")
  , $u = require("./__")
  , proto
;//}, $1 : { ───────────────────────────
var mds = "./_plugins/lib/api".split(" ")
;//}, $2 : { ───────────────────────────
exports = module.exports = create;
exports.version = "0.0.0"
;//}, $3 : { ───────────────────────────
function merge(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; };
function create() {

  function instance(options) {

  }

  merge(instance, proto);
  merge(instance, EventEmitter.prototype);
  //exports.util && (instance.util = exports.util);
  //for (var i = 0; i < arguments.length; ++i) { instance.use(arguments[i]); }
  return instance;
}

var proto = {};
proto.initialize=function(){
  console.log("initialize");
}
proto.route=function(){
  console.log("route");
}

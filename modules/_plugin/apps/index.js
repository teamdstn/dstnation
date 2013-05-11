exports = module.exports    = Plugin;
exports.inherits = function(ctor,stor){ctor.super_ = stor;ctor.prototype = Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}
exports.parse = require("url").parse;

function Plugin() {};
Plugin.prototype.authenticate = function (req, options) {};
/* ━━━━━━━━━━━━━━━━━━━━━━━━━*/

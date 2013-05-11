//[DEPENDENCE] : ━━━━━━━━━━━━━━━━━
var common      = require("../common")
  , Memory      = require("./memory").Memory
  , inherits    = function(ctor,stor){ctor.super_=stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})};
  ;//━━━━━━━━━━━━━━━━━━━━━━━━

var Env = exports.Env = function(options) {
    Memory.call(this, options);
    options = options || {};
    this.type = "env";
    this.readOnly = true;
    this.whitelist = options.whitelist || [];
    this.separator = options.separator || "";
    if (options instanceof Array) {
        this.whitelist = options;
    }
    if (typeof options === "string") {
        this.separator = options;
    }
};

inherits(Env, Memory);

Env.prototype.loadSync = function() {
    this.loadEnv();
    return this.store;
};

Env.prototype.loadEnv = function() {
    var self = this;
    this.readOnly = false;
    Object.keys(process.env).filter(function(key) {
        return !self.whitelist.length || self.whitelist.indexOf(key) !== -1;
    }).forEach(function(key) {
        if (self.separator) {
            self.set(common.key.apply(common, key.split(self.separator)), process.env[key]);
        } else {
            self.set(key, process.env[key]);
        }
    });
    this.readOnly = true;
    return this.store;
};
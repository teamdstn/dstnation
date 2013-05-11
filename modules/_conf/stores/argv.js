//[DEPENDENCE] : ━━━━━━━━━━━━━━━━━
var Memory      = require("./memory").Memory
  , inherits    = function(ctor,stor){ctor.super_=stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})};
  ;//━━━━━━━━━━━━━━━━━━━━━━━━

var Argv = exports.Argv = function(options) {
    Memory.call(this, options);
    this.type = "argv";
    this.readOnly = true;
    this.options = options || false;
};

inherits(Argv, Memory);

Argv.prototype.loadSync = function() {
    this.loadArgv();
    return this.store;
};

Argv.prototype.loadArgv = function() {
    var self = this, argv;
    argv = typeof this.options === "object" ? require("optimist")(process.argv.slice(2)).options(this.options).argv : require("optimist")(process.argv.slice(2)).argv;
    if (!argv) {
        return;
    }
    this.readOnly = false;
    Object.keys(argv).forEach(function(key) {
        self.set(key, argv[key]);
    });
    this.readOnly = true;
    return this.store;
};
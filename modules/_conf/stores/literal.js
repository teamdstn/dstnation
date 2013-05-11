//[DEPENDENCE] : ━━━━━━━━━━━━━━━━━
var Memory = require("./memory").Memory
  , inherits = function(ctor,stor){ctor.super_=stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})};
  ;//━━━━━━━━━━━━━━━━━━━━━━━━


var Literal = exports.Literal = function Literal(options) {
    Memory.call(this, options);
    options = options || {};
    this.type = "literal";
    this.readOnly = true;
    this.store = options.store || options;
};

inherits(Literal, Memory);

Literal.prototype.loadSync = function() {
    return this.store;
};
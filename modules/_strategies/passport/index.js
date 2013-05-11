exports = module.exports    = Strategy;
exports.BadRequestError     = BadRequestError;
exports.InternalOpenIDError = InternalOpenIDError;
exports.VerificationError   = VerificationError;

exports.inherits = function(ctor,stor){ctor.super_ = stor;ctor.prototype = Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}
exports.parse = require("url").parse;

exports.lookup = function(obj, fld) {
  if (!obj) return null;
  var chain = fld.split("]").join("").split("[");
  for (var i = 0, len = chain.length; i < len; i++) {
    var prop = obj[chain[i]];
    if (prop === void 0) return null;
    if (Object(prop) !== prop) return prop;
    obj = prop;
  }
  return null;
}

exports.proxy = function(n){
  var rst;
  for (var i=0, len = exports.proxies.length; i < len; ++i) {
    var _prx = exports.parse(exports.proxies[i]);
    _prx.uri = _prx.href = _prx.protocol +"//"+_prx.host;
    if(_prx.path.indexOf("/"+n)===0){
      return rst = _prx;
    }
  }
  return rst;
};
/*
  var _request = request;

  var cb  = function (E,R,B) {
    var _form = elemently(B, ["form"], [/login|sign/g]).form;
    if(R.headers.location){
      return _request(R.headers.location, cb)
    }
    if(_form && _form.login){
      _strategy.form = _form;
      _strategy.form.fld = {login:{}};
      each(_form.login.input, function(v, k) {
        if (elemently.nameRange.indexOf(k) > -1) {
          _strategy.form.fld.login[_strategy._nameFld] = k;
        } else if (elemently.passRange.indexOf(k) > -1) {
          _strategy.form.fld.login[_strategy._passFld] = k;
        }
      });
      console.log(_strategy.form);
    }
  };
*/
/* ━━━━━━━━━━━━━━━━━━━━━━━━━*/
function Strategy() {};
  Strategy.prototype.authenticate = function (req, options) {
};
/* ━━━━━━━━━━━━━━━━━━━━━━━━━*/
function InternalOpenIDError(message, err) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = "InternalOpenIDError";
  this.message = message;
  this.openidError = err;
}
InternalOpenIDError.prototype.__proto__ = Error.prototype;
InternalOpenIDError.prototype.toString = function () {
  var msg = this.message;
  if (this.openidError) {
    if (this.openidError instanceof Error) {
      msg += " (" + this.openidError + ")";
    } else if (this.openidError.message) {
      msg += " (message: " + this.openidError.message + ")";
    }
  }
  return m;
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━*/
function BadRequestError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = "BadRequestError";
  this.message = message || null;
}
BadRequestError.prototype.__proto__ = Error.prototype;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━*/
function VerificationError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = "VerificationError";
  this.message = message || null;
}
VerificationError.prototype.__proto__ = Error.prototype;


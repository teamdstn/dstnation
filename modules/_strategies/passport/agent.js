//[] :____________________
var Proto               = require("./index")
  , http                = require("http")
  , crypto              = require("crypto")
  , querystring         = require("querystring")
  , BadRequestError     = Proto.BadRequestError
  , VerificationError   = Proto.VerificationError
  , tunnel              = require("./../../tunnel")
  , elemently           = require("./../../elemently")
  , request             = require("./../../request")
;//_________________________________
exports = module.exports  = strategy;
exports.Strategy          = Strategy;
var each = function(o, i) { Object.keys(o).forEach(function (k) { i(o[k], k, o); }); }
var lookup = Proto.lookup;


function strategy(options, verify) {
  var _strategy = new Strategy(options, verify);
  var _opt = {followRedirect:true};
  options.proxy && (_strategy.proxy = Proto.proxy("S").uri, _opt.proxy = _strategy.proxy);

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

    }
  };
  _request(_strategy.url, _opt, cb);
  return _strategy;
}

function Strategy(options, verify) {
  if(!options && !(options.uri || options.url)) return console.error("[31m%s [0m: [31m[1m%s [0m", "E:","XSET_OPT");
  var _verify = function (cookies, profile, done) {
    process.nextTick(function () {
      profile.cookies = cookies;
      return done(null, profile);
    });
  };

  Proto.call(this);
  this.url      = options.pathes[0];
  this.uri      = Proto.parse(this.url);
  this.pathes   = options.pathes;
  this._form    = options.form || {username:"username", password:"password"};
  this.name     = options.name || "agent";
  this._verify  = verify || _verify;

}
Proto.inherits(Strategy, Proto);

Strategy.prototype.authenticate = function (req, options) {

  /* common */
  options = options || {};
  var self  = this;

  var _name = lookup(req.body, this._form.username) || lookup(req.query, this._form.username);
  var _pass = lookup(req.body, this._form.password) || lookup(req.query, this._form.password);
  var _type = req.body.method || "authenticate";

  if (!_name || !_pass) return this.fail(new BadRequestError(options.badRequestMessage || "Missing credentials"));
  var verified = function(err, user, info) { return !err && user ? self.success(user, info) : err ? self.error(err) : self.fail(info); }


  var _form = {};
  self.form.login.attr.id && (_form.id = self.form.login.attr.id);
  self.form.login.attr.name && (_form.name = self.form.login.attr.name);
  each(self.form.login.input, function(v,k){
    _form[k] = v
  })
  _form[self.form.fld.login[this._form.username]] = _name;
  _form[self.form.fld.login[this._form.password]] = _pass;
  _form.op = "Login";

  var _action = _form.action || self.pathes[1];
  var _ul = _action.indexOf("http")>-1? _action : self.url + _action;
  var verified = function(err, user, info) { return !err && user ? self.success(user, info) : err ? self.error(err) : self.fail(info); }
  var _arg = [_name, _pass, verified];
  var _opt = {followRedirect:false, form: _form};
  this.proxy && (_opt.proxy = this.proxy);
  var _request = request;
  var cb = function (E, R, B) {
    if(R.headers.location){
      _request(R.headers.location, cb);
    }else{
      var _ul = self.pathes[2].indexOf("http")>-1? self.pathes[2] : self.url + self.pathes[2];
      _request(_ul, function (_E, _R, _B) {
        var _cookies = this.getJar();
        var _profile = { html:_B };
        /*, _id = _profile.cookies.filter(function(n){return n.name==="SESS"})*/
        self._verify(_cookies||[], _profile, verified);
      });
    };
  };
  _request.post(_ul, _opt, cb);
}
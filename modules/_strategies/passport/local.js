//[] :____________________
var Proto           = require("./index")
  , BadRequestError = Proto.BadRequestError
  , mongoose  = require("mongoose")
  , bcryption = require("../../_orm/plugins/bcryption")
;//_________________________________
exports = module.exports  = strategy;
exports.Strategy          = Strategy;
exports.BadRequestError   = BadRequestError;

var lookup = Proto.lookup;

function strategy(options, verify) {
  var _strategy = new Strategy(options, verify);
  return _strategy;
}

function Strategy(options, verify) {

  if (typeof options == "function") { verify = options; options = {};}
  options = options || {};
  options.model = options.model || {type: "orm", path: "mongodb://localhost:edge", name:"user", plugin:"bcryption"};

  var self = this;
  this._form  = options.form || {username:"username", password:"password"};

  if(options.db && typeof options.db === mongoose.connection){
    console.log(options.db);
  }else{
    var db = mongoose.createConnection();
    db.open(options.model.path || "mongodb://localhost:edge");
    db.once("connected", function(){
      var _mname = options.model.name || "user";
      //self._model = db.model(_mname);
      if(!self._model){
        var _schema = new mongoose.Schema({});
        options.model.plugin && (_schema.plugin(bcryption));
        self._model = db.model(_mname, _schema);
      }
    });
  }

  Proto.call(this);
  this.name     = options.name || "local";
  options.before  && (this._before = options.before);
  options.then    && (this._then = options.then);
}

Proto.inherits(Strategy, Proto);

Strategy.prototype._verify = function (username, password, done) {
  this._model.authenticate(username, password, function (err, user) {

    if (err)   return done(null, false, {message: err.toString()});
    if (!user) return done(null, false, {message: "User not found"});

    return done(null, user);
  });
};

Strategy.prototype.authenticate = function (req, options) {
  options = options || {};

  var _name = lookup(req.body, this._form.username) || lookup(req.query, this._form.username);
  var _pass = lookup(req.body, this._form.password) || lookup(req.query, this._form.password);
  var _type = req.body.method || "authenticate";

  if (!_name || !_pass) return this.fail(new BadRequestError(options.badRequestMessage || "Missing credentials"));

  var self = this;
  var verified = function(err, user, info) { return !err && user ? self.success(user, info) : err ? self.error(err) : self.fail(info); }

  var _arg = [_name, _pass, verified];
  this._before  && (_arg.unshift(req));
  this._then    && (_arg.push(req));

  if(_type === "register"){
    self._model.register({name:_name, password:_pass}, function (err, o) {
      if(err) return self.error(err);
      self._verify.apply(self, _arg);
    })
  }else{
    self._verify.apply(self, _arg);
  }
};














/* none bcrypting ===========================
this._saltField = options.saltField || "salt";
===========================
none bcrypting ===========================
var schemaConfig = {};
schemaConfig[this._nameFld] = String;
schemaConfig[this._passFld] = String;
schemaConfig[this._saltField] = String;
this._model = this._db.model(this._modelName, new mongoose.Schema(schemaConfig));
===========================

none bcrypting ===========================
var saltField = this._saltField;
var query = {};
query[nameFld] = username;
var strategy = this;
this._model.findOne(query, function (err, user) {
===========================

none bcrypting ===========================
var hashedPassword = user[passFld];
var salt = user[saltField];
strategy.hashPassword(password, salt, function (err, derivedKey) {
if (err) return done(err);
if (derivedKey != hashedPassword) return done(null, false, {
message: "Bad password"
});
return done(null, user);
});
// ===========================

none bcrypting ===========================
var salt = this.generateSalt();
var strategy = this;
this.hashPassword(password, salt, function (err, derivedKey) {
if (err) return done(err);
var user = new strategy._model();
user[strategy._nameFld] = username;
user[strategy._passFld] = derivedKey;
user[strategy._saltField] = salt;
user.save(function (err) {
done(err);
});
done(null, user);
});
===========================


none bcrypting ===========================
Strategy.prototype.generateSalt = function (len) {
var set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var setLen = set.length;
var salt = "";
len || (len = 128);
for (var i = 0; i < len; i++) {
var p = Math.floor(Math.random() * setLen);
salt += set[p];
}
return salt;
};

Strategy.prototype.hashPassword = function (password, salt, done) {
var iterations = 1e4;
var keylen = 128;
crypto.pbkdf2(password, salt, iterations, keylen, done);
};
===========================

var self = this;
if(this.method === "reg"){
var user = new this._model();

user.name     = username;
user.password = password;
console.log("REG", username, password);
this._model.register(user, function (err, user) {
console.log(err, user);
if (err) return done(null, false, { message: err.toString() });

console.log("REG_", username, password);
self._model.authenticate(username, password, function (err, user) {

console.log("authenticate", err, user);

if (err) return done(null, false, {
message: err.toString()
});
if (!user) return done(null, false, {
message: "User not found"
});
return done(null, user);
});
});


}else{

if(req.body.method){
if(req.body.method === "reg"){
var user = new this._model();
user.name = username;
user.password = password;
this._model.register(user, function (err, user) {
if (err) return done(null, false, {
message: err.toString()
});
if (!user) return done(null, false, {
message: "User not found"
});
return verified(err, user);
});


}
}else{
*/
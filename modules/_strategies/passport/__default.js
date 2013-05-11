//[] :____________________
var Proto           = require("./index")
  , BadRequestError = Proto.BadRequestError
  , mongoose  = require("mongoose")
  , bcryption = require("../../_orm/plugins/bcryption")
;//_________________________________
exports = module.exports  = strategy;
exports.Strategy          = Strategy;
exports.BadRequestError   = BadRequestError;

function strategy(options, verify) {
  var _strategy = new Strategy(options, verify);
  return _strategy;
}

function Strategy(options, verify) {
  if (typeof options == "function") {
    verify = options;
    options = {};
  }
  options = options || {};
  this._nameFld = options.nameFld || "name";
  this._passFld = options.passFld || "password";
  /* none bcrypting ===========================
    this._saltField = options.saltField || "salt";
  //=========================== */

  this._modelName = options.modelName || "user";
  this._db = options.connection || mongoose.createConnection("localhost", "edge");
  try {
    this._model = this._db.model(this._modelName);
  } catch (e) {
    var _schema = new mongoose.Schema({});
    _schema.plugin(bcryption);
    this._model = this._db.model(this._modelName, _schema);

    /* none bcrypting ===========================
    var schemaConfig = {};
    schemaConfig[this._nameFld] = String;
    schemaConfig[this._passFld] = String;
    schemaConfig[this._saltField] = String;
    this._model = this._db.model(this._modelName, new mongoose.Schema(schemaConfig));
   =========================== */
  }

  Proto.call(this);
  this.name = options.name || "local";
  console.log(this.name)
  this._passReqToCallback = options.passReqToCallback;
}

Proto.inherits(Strategy, Proto);

Strategy.prototype._verify = function (username, password, done) {
  var nameFld = this._nameFld;
  var passFld = this._passFld;
  var strategy = this;
  /* none bcrypting ===========================
  var saltField = this._saltField;
  var query = {};
  query[nameFld] = username;
  var strategy = this;
  this._model.findOne(query, function (err, user) {
  =========================== */
  this._model.authenticate(username, password, function (err, user) {
    console.log(user)
    if (err) return done(null, false, {
      message: err.toString()
    });
    if (!user) return done(null, false, {
      message: "User not found"
    });
    return done(null, user);
    /* none bcrypting ===========================

    var hashedPassword = user[passFld];
    var salt = user[saltField];
    strategy.hashPassword(password, salt, function (err, derivedKey) {
      if (err) return done(err);
      if (derivedKey != hashedPassword) return done(null, false, {
        message: "Bad password"
      });
      return done(null, user);
    });
    // =========================== */
  });
};

Strategy.prototype.authenticate = function (req, options) {
  options = options || {};
  var _name = lookup(req.body, this._nameFld) || lookup(req.query, this._nameFld);
  var _pass = lookup(req.body, this._passFld) || lookup(req.query, this._passFld);
  var _type = req.body.method || "authenticate";

  if (!_name || !_pass) {
    return this.fail(new BadRequestError(options.badRequestMessage || "Missing credentials"));
  }

  var self = this;
  var verified = function(err, user, info) { return !err && user ? self.success(user, info) : err ? self.error(err) : self.fail(info); }

  var _arg = [_name, _pass, verified];
  this._passReqToCallback && (_arg.unshift(req));

  if(_type === "register"){
    self._model.register({name:_name, password:_pass}, function (err, o) {
      if(err) return self.error(err);
      self._verify.apply(self, _arg);
    })
  }else{
    self._verify.apply(self, _arg);
  }
};

function lookup(obj, field) {
  if (!obj) return null;
  var chain = field.split("]").join("").split("[");
  for (var i = 0, len = chain.length; i < len; i++) {
    var prop = obj[chain[i]];
    if (prop === void 0) return null;
    if (Object(prop) !== prop) return prop;
    obj = prop;
  }
  return null;
}

Strategy.prototype.createUser = function (username, password, done) {
  var user = new this._model();
  user[this._nameFld] = username;
  user[this._passFld] = password;
  this._model.register(user, function(err, user){
    done(null, user);
  });

  /* none bcrypting ===========================
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
  =========================== */
};

/* none bcrypting ===========================
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
=========================== */

/*
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
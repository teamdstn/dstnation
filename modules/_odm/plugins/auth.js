var mongoose = require("mongoose")
  , crypto = require("crypto")
;
var Schema = mongoose.Schema;

Schema.prototype.defineHashedPassword = function (algorithm, validate) {
  this.add({
    hsh: String,
    slt: String
  });
  this.virtual("password").set(function (pw) {
    this._password = pw;
    this.slt = this.createSalt();
    this.hsh = this.encryptPassword(pw);
  }).get(function () {
    return this._password;
  });
  this.methods.authenticate = function (plain) {
    return this.encryptPassword(plain) === this.hsh;
  };
  this.methods.createSalt = function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  };
  this.methods.encryptPassword = function (str) {
    return crypto.createHmac(algorithm, this.slt).update(str).digest("hex");
  };
  this.pre("save", function (next) {
    if (validate && !validate(this.password)) return next(new Error("Invalid password"));
    next();
  });
};

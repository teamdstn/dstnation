var http = require("http")
  , req = http.IncomingMessage.prototype;

req.login = req.logIn = function (user, options, done) {
  if (!this._passport) throw new Error("passport.initialize() middleware not in use");
  if (!done && typeof options === "function") {
    done = options;
    options = {};
  }
  options = options || {};
  var property = this._passport.instance._userProperty || "user";
  var session = options.session === undefined ? true : options.session;
  this[property] = user;

  if (session) {
    var self = this;
    this._passport.instance.serializeUser(user, function (err, obj) {
      if (err) {
        self[property] = null;
        return done(err);
      }
      self._passport.session.user = obj;
      done();
    });
  } else {
    done && done();
  }

};

req.logout = req.logOut = function () {
  if (!this._passport) throw new Error("passport.initialize() middleware not in use");
  var property = this._passport.instance._userProperty || "user";
  this[property] = null;
  delete this._passport.session.user;
};

req.isAuthenticated = function () {
  var property = "user";
  if (this._passport && this._passport.instance._userProperty) {
    property = this._passport.instance._userProperty;
  }
  return this[property] ? true : false;
};

req.isUnauthenticated = function () {
  return !this.isAuthenticated();
};

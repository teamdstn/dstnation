var Proto = require("./index");

exports = module.exports = strategy;

function strategy() {
  var _strategy = new Strategy();
  return _strategy;
}

exports.Strategy = Strategy;
function Strategy() {
  Proto.call(this);
  this.name = "session";
}
Proto.inherits(Strategy, Proto);

Strategy.prototype.authenticate = function(req) {
  if (!req._passport) {
    return this.error(new Error("passport.initialize() middleware not in use"));
  }
  var self = this;
  if (req._passport.session.user) {
    req._passport.instance.deserializeUser(req._passport.session.user, function(err, user) {
      if (err) return self.error(err);
      if (!user) {
        delete req._passport.session.user;
        return self.pass();
      }
      var property = req._passport.instance._userProperty || "user";
      req[property] = user;
      self.pass();
    });
  } else {
    self.pass();
  }
};

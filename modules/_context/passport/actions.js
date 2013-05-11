var actions = module.exports = {};

actions.success = function (user, info) {
  this.delegate.success.apply(this, arguments);
};
actions.fail = function (challenge, status) {
  this.delegate.fail.apply(this, arguments);
};
actions.redirect = function (url, status) {
  this.res.statusCode = status || 302;
  this.res.setHeader("Location", url);
  this.res.end();
};
actions.pass = function () {
  this.next();
};

actions.error = function (err) {
  this.next(err);
};

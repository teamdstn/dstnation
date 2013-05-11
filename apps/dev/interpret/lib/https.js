var HTTPServer = require("./httpServer")
  , https = require("https");

var HTTPSServer = exports.Server = function HTTPSServer(options, middleware) {
  this.stack = [];

  middleware.forEach(function(fn) { this.use(fn); }, this);

  https.Server.call(this, options, this.handle);
};

HTTPSServer.prototype.__proto__ = HTTPServer.prototype;

Object.keys(HTTPServer.prototype).forEach(function(method) {
    HTTPSServer.prototype[method] = HTTPServer.prototype[method];
});
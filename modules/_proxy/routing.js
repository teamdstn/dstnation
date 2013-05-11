//[DEPENDENCE] :_________________________________
var events      = require("events")
  , util        = require("util")
  , HttpProxy   = require("./http").HttpProxy
  , ProxyTable  = require("./table").ProxyTable
;//______________________________________________

var RoutingProxy = exports.RoutingProxy = function(options) {
  events.EventEmitter.call(this);
  var self = this;
  options = options || {};
  if (options.router) {
    this.proxyTable = new ProxyTable(options);
    this.proxyTable.on("routes", function(routes) {
      self.emit("routes", routes);
    });
  }
  this.proxies = {};
  this.target = {};
  this.target.https = options.target && options.target.https;
  this.source = options.source || {
    host: "localhost",
    port: 8e3
  };
  this.https = this.source.https || options.https;
  this.enable = options.enable;
  this.forward = options.forward;
  this.changeOrigin = options.changeOrigin || false;
  this.on("newListener", function(evt) {
    if (evt === "proxyError" || evt === "webSocketProxyError") {
      Object.keys(self.proxies).forEach(function(key) {
        self.proxies[key].on(evt, this.emit.bind(this, evt));
      });
    }
  });
};

util.inherits(RoutingProxy, events.EventEmitter);

RoutingProxy.prototype.add = function(options) {
  var self = this, key = this._getKey(options);
  options.target = options.target || {};
  options.target.host = options.target.host || options.host;
  options.target.port = options.target.port || options.port;
  options.target.https = this.target && this.target.https || options.target && options.target.https;
  [ "https", "enable", "forward", "changeOrigin" ].forEach(function(key) {
    if (options[key] !== false && self[key]) {
      options[key] = self[key];
    }
  });
  this.proxies[key] = new HttpProxy(options);
  if (this.listeners("proxyError").length > 0) {
    this.proxies[key].on("proxyError", this.emit.bind(this, "proxyError"));
  }
  if (this.listeners("webSocketProxyError").length > 0) {
    this.proxies[key].on("webSocketProxyError", this.emit.bind(this, "webSocketProxyError"));
  }
  this.proxies[key].on("start", this.emit.bind(this, "start"));
  this.proxies[key].on("forward", this.emit.bind(this, "forward"));
  this.proxies[key].on("end", this.emit.bind(this, "end"));
};

RoutingProxy.prototype.remove = function(options) {
  var key = this._getKey(options), proxy = this.proxies[key];
  delete this.proxies[key];
  return proxy;
};

RoutingProxy.prototype.close = function() {
  var self = this;
  if (this.proxyTable) {
    this.proxyTable.close();
  }
  Object.keys(this.proxies).forEach(function(key) {
    self.proxies[key].close();
  });
};

RoutingProxy.prototype.proxyRequest = function(req, res, options) {
  options = options || {};
  var location;
  if (this.proxyTable && !options.host) {
    location = this.proxyTable.getProxyLocation(req);
    if (!location) {
      try {
        res.writeHead(404);
        res.end();
      } catch (er) {
        console.error("res.writeHead/res.end error: %s", er.message);
      }
      return;
    }
    options.port = location.port;
    options.host = location.host;
  }
  var key = this._getKey(options), proxy;
  if (this.target && this.target.https || location && location.protocol === "https") {
    options.target = options.target || {};
    options.target.https = true;
  }
  if (!this.proxies[key]) {
    this.add(options);
  }
  proxy = this.proxies[key];
  proxy.proxyRequest(req, res, options.buffer);
};

RoutingProxy.prototype.proxyWebSocketRequest = function(req, socket, head, options) {
  options = options || {};
  var location, proxy, key;
  if (this.proxyTable && !options.host) {
    location = this.proxyTable.getProxyLocation(req);
    if (!location) {
      return socket.destroy();
    }
    options.port = location.port;
    options.host = location.host;
  }
  key = this._getKey(options);
  if (!this.proxies[key]) {
    this.add(options);
  }
  proxy = this.proxies[key];
  proxy.proxyWebSocketRequest(req, socket, head, options.buffer);
};

RoutingProxy.prototype._getKey = function(options) {
  if (!options || (!options.host || !options.port) && (!options.target || !options.target.host || !options.target.port)) {
    throw new Error("options.host and options.port or options.target are required.");
  }
  return [ options.host || options.target.host, options.port || options.target.port ].join(":");
};
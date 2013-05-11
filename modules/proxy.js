//[DEPENDENCE] :_________________________________
var events    = require("events")
  , util      = require("util")
  , http      = require("http")
  , https     = require("https")
;//______________________________________________

//[UTILITY] :_____________________________________
var maxSockets = 100
;//_______________________________________________
//[EXPORTS] :_____________________________________
var HttpProxy     = exports.HttpProxy     = require("./_proxy/http").HttpProxy
  , ProxyTable    = exports.ProxyTable    = require("./_proxy/table").ProxyTable
  , RoutingProxy  = exports.RoutingProxy  = require("./_proxy/routing").RoutingProxy
;//_______________________________________________

exports.createServer = function() {
  var args = Array.prototype.slice.call(arguments), handlers = [], callback, options = {}, message, handler, server, proxy, host, port;
  args.forEach(function(arg) {
    switch (typeof arg) {
      case "string":
      host = arg;
      break;

      case "number":
      port = arg;
      break;

      case "object":
      options = arg || {};
      break;

      case "function":
      callback = arg;
      handlers.push(callback);
      break;
    }
  });
  function validArguments() {
    var conditions = {
      "port and host": function() {
        return port && host;
      },
      "options.target or options.router": function() {
        return options && (options.router || options.target && options.target.host && options.target.port);
      },
      "or proxy handlers": function() {
        return handlers && handlers.length;
      }
    };
    var missing = Object.keys(conditions).filter(function(name) {
      return !conditions[name]();
    });
    if (missing.length === 3) {
      message = "Cannot proxy without " + missing.join(", ");
      return false;
    }
    return true;
  }
  if (!validArguments()) {
    throw new Error(message);
    return;
  }
  options.target      = options.target || {};
  options.target.port = options.target.port || port;
  options.target.host = options.target.host || host;

  if (options.target && options.target.host && options.target.port) {
    proxy = new HttpProxy(options);
    handlers.push(function(req, res) {
      proxy.proxyRequest(req, res);
    });
  } else {
    proxy = new RoutingProxy(options);
    if (options.router) {
      handlers.push(function(req, res) {
        proxy.proxyRequest(req, res);
      });
      proxy.on("routes", function(routes) {
        server.emit("routes", routes);
      });
    }
  }
  handler = handlers.length > 1 ? exports.stack(handlers, proxy) : function(req, res) {
    handlers[0](req, res, proxy);
  };
  server = options.https ? https.createServer(options.https, handler) : http.createServer(handler);
  server.on("close", function() {
    proxy.close();
  });
  if (!callback) {
    server.on("upgrade", function(req, socket, head) {
      proxy.proxyWebSocketRequest(req, socket, head);
    });
  }
  server.proxy = proxy;
  return server;
};

exports.buffer = function(obj) {
  var events = [], onData, onEnd;
  obj.on("data", onData = function(data, encoding) {
    events.push([ "data", data, encoding ]);
  });
  obj.on("end", onEnd = function(data, encoding) {
    events.push([ "end", data, encoding ]);
  });
  return {
    end: function() {
      obj.removeListener("data", onData);
      obj.removeListener("end", onEnd);
    },
    destroy: function() {
      this.end();
      this.resume = function() {
        console.error("Cannot resume buffer after destroying it.");
      };
      onData = onEnd = events = obj = null;
    },
    resume: function() {
      this.end();
      for (var i = 0, len = events.length; i < len; ++i) {
        obj.emit.apply(obj, events[i]);
      }
    }
  };
};

exports.getMaxSockets = function() {
  return maxSockets;
};

exports.setMaxSockets = function(value) {
  maxSockets = value;
};

exports.stack = function stack(middlewares, proxy) {
  var handle;
  middlewares.reverse().forEach(function(layer) {
    var child = handle;
    handle = function(req, res) {
      var next = function(err) {
        if (err) {
          if (res._headerSent) {
            res.destroy();
          } else {
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain");
            res.end("Internal Server Error");
          }
          console.error("Error in middleware(s): %s", err.stack);
          return;
        }
        if (child) {
          child(req, res);
        }
      };
      next.__proto__ = proxy;
      layer(req, res, next);
    };
  });
  return handle;
};

exports._getAgent = function _getAgent(options) {
  if (!options || !options.host) {
    throw new Error("`options.host` is required to create an Agent.");
  }
  if (!options.port) {
    options.port = options.https ? 443 : 80;
  }
  var Agent = options.https ? https.Agent : http.Agent, agent;
  agent = new Agent(options);
  return agent;
};

exports._getProtocol = function _getProtocol(options) {
  return options.https ? https : http;
};

exports._getBase = function _getBase(options) {
  var result = function() {};
  if (options.https && typeof options.https === "object") {
    [ "ca", "cert", "key" ].forEach(function(key) {
      if (options.https[key]) {
        result.prototype[key] = options.https[key];
      }
    });
  }
  return result;
};
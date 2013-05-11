//[DEPENDENCE] :_________________________________
var events  = require("events")
  , util    = require("util")
  , url     = require("url")
  , fs      = require("fs")
;//______________________________________________

var ProxyTable = exports.ProxyTable = function(options) {
  events.EventEmitter.call(this);
  this.silent = options.silent || options.silent !== true;
  this.target = options.target || {};
  this.hostnameOnly = options.hostnameOnly === true;
  if (typeof options.router === "object") {
    this.setRoutes(options.router);
  } else if (typeof options.router === "string") {
    var self = this;
    this.routeFile = options.router;
    this.setRoutes(JSON.parse(fs.readFileSync(options.router)).router);
    fs.watchFile(this.routeFile, function() {
      fs.readFile(self.routeFile, function(err, data) {
        if (err) {
          self.emit("error", err);
        }
        self.setRoutes(JSON.parse(data).router);
        self.emit("routes", self.hostnameOnly === false ? self.routes : self.router);
      });
    });
  } else {
    throw new Error("Cannot parse router with unknown type: " + typeof router);
  }
};

util.inherits(ProxyTable, events.EventEmitter);

ProxyTable.prototype.setRoutes = function(router) {
  if (!router) {
    throw new Error("Cannot update ProxyTable routes without router.");
  }
  var self = this;
  this.router = router;
  if (this.hostnameOnly === false) {
    this.routes = [];
    Object.keys(router).forEach(function(path) {
      if (!/http[s]?/.test(router[path])) {
        router[path] = (self.target.https ? "https://" : "http://") + router[path];
      }
      var target = url.parse(router[path]), defaultPort = self.target.https ? 443 : 80;
      self.routes.push({
        source: {
          regexp: new RegExp("^" + path, "i"),
          sref: path,
          url: url.parse("http://" + path)
        },
        target: {
          sref: target.hostname + ":" + (target.port || defaultPort) + target.path,
          url: target
        }
      });
    });
  }
};

ProxyTable.prototype.getProxyLocation = function(req) {
  if (!req || !req.headers || !req.headers.host) {
    return null;
  }
  var target = req.headers.host.split(":")[0];
  if (this.hostnameOnly === true) {
    if (this.router.hasOwnProperty(target)) {
      var location = this.router[target].split(":"), host = location[0], port = location.length === 1 ? 80 : location[1];
      return {
        port: port,
        host: host
      };
    }
  } else {
    target += req.url;
    for (var i in this.routes) {
      var route = this.routes[i];
      if (target.match(route.source.regexp)) {
        var parsed = url.parse(req.url);
        parsed.pathname = parsed.pathname.replace(route.source.url.pathname, route.target.url.pathname);
        req.url = url.format(parsed);
        return {
          protocol: route.target.url.protocol.replace(":", ""),
          host: route.target.url.hostname,
          port: route.target.url.port || (this.target.https ? 443 : 80)
        };
      }
    }
  }
  return null;
};

ProxyTable.prototype.close = function() {
  if (typeof this.routeFile === "string") {
    fs.unwatchFile(this.routeFile);
  }
};
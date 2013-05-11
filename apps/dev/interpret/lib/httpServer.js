var http    = require("http")
  , debug   = require("debug")("connect:dispatcher")
  , assert  = require("assert")
  , $u      = require("./utils")
  , trace   = require("./trace");

module.exports = HTTPServer;

var env = process.env.NODE_ENV || "development";

function HTTPServer(middleware) {
    this.stack = [];
    middleware.forEach(function(fn) {
        this.use(fn);
    }, this);
    http.Server.call(this, this.handle);
}

HTTPServer.prototype.use = function(route, fn) {
    if ("string" != typeof route) {
        fn = route;
        route = "/";
    }
    if ("function" == typeof fn.handle) {
        var server = fn;
        fn.route = route;
        fn = function(req, res, next) {
            server.handle(req, res, next);
        };
    }
    if (fn instanceof http.Server) {
        fn = fn.listeners("request")[0];
    }
    if ("/" == route[route.length - 1]) {
        route = route.slice(0, -1);
    }
    debug("use %s %s", route || "/", fn.name || "anonymous");
    this.stack.push({
        route: route,
        handle: fn
    });
    return this;
};

HTTPServer.prototype.handle = function(req, res, out) {
    var writeHead = res.writeHead, stack = this.stack, removed = "", uparse = require("url").parse, index = 0, len = 0;
    function next(err) {
        var layer, path, c;
        req.url = removed + req.url;
        req.originalUrl = req.originalUrl || req.url;
        removed = "";
        layer = stack[index++];
        if (!layer || res.headerSent) {
            if (out) return out(err);
            if (err) {
                var msg = "production" == env ? "Internal Server Error" : err.stack || err.toString();
                if ("test" != env) trace.error(err.stack || err.toString());
                if (res.headerSent) return req.socket.destroy();
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                if ("HEAD" == req.method) return res.end();
                res.end(msg);
            } else {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                if ("HEAD" == req.method) return res.end();
                res.end("Cannot " + req.method + " " + $u.escape(req.originalUrl));
            }
            return;
        }
        try {
            path = uparse(req.url).pathname;
            if (undefined == path) path = "/";
            if (0 != path.indexOf(layer.route)) return next(err);
            c = path[layer.route.length];
            if (c && "/" != c && "." != c) return next(err);
            removed = layer.route;
            req.url = req.url.substr(removed.length);
            if ("/" != req.url[0]) req.url = "/" + req.url;
            len = layer.handle.length;
            if (err) {
                if (len === 4) {
                    layer.handle(err, req, res, next);
                } else {
                    next(err);
                }
            } else if (len < 4) {
                layer.handle(req, res, next);
            } else {
                next();
            }
        } catch (e) {
            if (e instanceof assert.AssertionError) {
                trace.error(e.stack + "\n");
                next(e);
            } else {
                next(e);
            }
        }
    }
    next();
};

HTTPServer.prototype.__proto__ = http.Server.prototype;

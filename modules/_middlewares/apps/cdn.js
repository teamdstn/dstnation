var send = require("send"),
  utils = require("../utils"),
  parse = utils.parseUrl,
  url = require("url");

exports = module.exports = function static(root, options) {
  options = options || {};
  if (!root) throw new Error("static() root path required");
  var redirect = false === options.redirect ? false : true;
  return function static(req, res, next) {
    if ("GET" != req.method && "HEAD" != req.method) return next();
    var path = parse(req).pathname;
    var pause = utils.pause(req);

    function resume() {
      next();
      pause.resume();
    }

    function directory() {
      if (!redirect) return resume();
      var pathname = url.parse(req.originalUrl).pathname;
      res.statusCode = 301;
      res.setHeader("Location", pathname + "/");
      res.end("Redirecting to " + utils.escape(pathname) + "/");
    }

    function error(err) {
      if (404 == err.status) return resume();
      next(err);
    }
    send(req, path).maxage(options.maxAge || 0).root(root).hidden(options.hidden).on("error", error).on("directory", directory).pipe(res);
  };
};

exports.mime = send.mime;

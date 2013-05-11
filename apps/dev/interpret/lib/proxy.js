var $u          = require('./utils')
  , Stream      = require("stream")
  , zlib        = require("zlib")
  , http        = require("http")
  , https       = require("https")
  , proto       = require('./proto')
  , trace       = require("./trace")
;

var slice     = [].slice;
var config    ={transparent:false};
var isSecure  = function(req) {return req.client && req.client.pair?!0 : req.forceSsl? !0 : !1};


/* "class Proxy " : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
exports.createProxy = function() {
  return new Proxy(1 <= arguments.length ? slice.call(arguments, 0) : []);
};

var Proxy = exports.Proxy = (function(_super) {

  $u.extends(Proxy, _super);

  function Proxy(middlewares) {
    if (Array.isArray(middlewares)) {
      this.middlewares = middlewares;
    } else {
      this.middlewares = [middlewares];
    }
    Proxy.__super__.constructor.call(this, this.bookendedMiddleware());
  };

  Proxy.prototype.bookendedMiddleware = function() {

    this.middlewares.unshift(this.proxyCleanup);
    this.middlewares.push(this.outboundProxy);
    return this.middlewares;
  };

  Proxy.prototype.proxyCleanup = function(req, res, next) {
    var proxyUrl, safeUrl;
    var uri = $u.uparse(req.url);
    req.mf || (req.mf = {});
    res.mf || (res.mf = {});
    req.path = uri.path;

    req.pathname  = uri.pathname;
    req.host      = req.headers['host'].split(":")[0];
    req.port      = req.headers['host'].split(":")[1];

    if (isSecure(req)) {
      req.href  = "https://" + req.headers['host'] + uri.path;
      req.ssl   = true;
      req.port || (req.port = 443);
    } else {
      req.port || (req.port = 80);

      if (config.transparent) {
        req.href = "http://" + req.headers['host'] + req.url;
      } else {
        safeUrl = '';
        proxyUrl = $u.uparse(req.url.slice(1));
        safeUrl += proxyUrl.pathname;
        if (proxyUrl.search != null) {
          safeUrl += proxyUrl.search;
        }
        req.url   = safeUrl;
        req.port  = proxyUrl.port;
        req.href  = proxyUrl.href;
      }
    }
    bodyLogger(req, 'request');
    return next();
  };

  Proxy.prototype.outboundProxy = function(req, res, next) {
    var passed_opts, upstream_processor, upstream_request;
    req.startTime = new Date;
    passed_opts = {
      method  : req.method,
      path    : req.url,
      host    : req.host,
      headers : req.headers,
      port    : req.port
    };

    upstream_processor = function(upstream_res) {
      res.statusCode = upstream_res.statusCode;
      res.headers = upstream_res.headers;
      if (res.headers && res.headers['content-type'] && res.headers['content-type'].search(/(text)|(application)/) >= 0) {
        res.isBinary = false;
      } else {
        res.isBinary = true;
      }
      res.emit('headers', res.headers);
      bodyLogger(res, 'response');
      res.writeHead(res.statusCode, res.headers);

      upstream_res.on('data', function(chunk) {
        res.write(chunk, 'binary');
        return res.emit('data', chunk);
      });

      upstream_res.on('end', function(data) {
        res.endTime = new Date;
        res.end(data);
        return res.emit('end');
      });

      upstream_res.on('close', function() {
        return res.emit('close');
      });

      return upstream_res.on('error', function(err) {
        trace.error("Upstream Response Error - " + err);
        return res.emit('close');
      });
    };

    req.on('data', function(chunk) {
      return upstream_request.write(chunk);
    });

    req.on('error', function(error) {
      return trace.error("ERROR: " + error);
    });

    upstream_request = req.ssl ? https.request( passed_opts, upstream_processor) : http.request( passed_opts, upstream_processor);

    upstream_request.on('error', function(err) {
      trace.error("Upstream Fail - " + req.method + " - " + req.href);
      return trace.error(err);
    });
    return upstream_request.end();
  };

  return Proxy;

})(proto.HTTPServer);

/* "private bodyLogger " : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function bodyLogger(stream, type, callback) {
  var data = [], length, unzipper;

  var assembleBody = function() {
    var buffer;
    stream.body = new Buffer(stream.length);
    for (var i = 0, len = data.length, offset = 0; i < len; i++) {
      buffer = data[i];
      buffer.copy(stream.body, offset);
      offset += buffer.length;
    }
    return data = null;
  };
  callback || (callback = function() {
    assembleBody();
    stream.emit('body');
    if (type === 'response') {
      return trace.info("Captured " + stream.body.length + " bytes from " + stream.statusCode);
    }
  });

  length = parseInt(stream.headers['content-length'], 10) || 0;
  stream.body = new Buffer(parseInt(stream.headers['content-length'], 10));
  stream.length = 0;

  var unzipper = zlib.createUnzip();
  unzipper.on('data', function(datum) {
    data.push(datum);
    return stream.length += datum.length;
  });

  unzipper.on('end', function() {
    return callback();
  });

  unzipper.destroy = function() {
    return trace.info(stream.headers);
  };

  switch (stream.headers['content-encoding']) {
    case 'gzip':
      trace.info("Unzipping");
      stream.pipe(unzipper);
      break;
    case 'deflate':
      trace.info("Deflating");
      stream.pipe(unzipper);
      break;
    default:
      stream.on('data', function(datum) {
        data.push(datum);
        return stream.length += datum.length;
      });
      stream.on('end', function() {
        return callback();
      });
      break;
  }
};

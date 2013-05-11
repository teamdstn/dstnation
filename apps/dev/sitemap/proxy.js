var express     = require('express')
  , http        = require('http')
  , path        = require('path')
  , fs          = require('fs')
  , net         = require('net')
  , tls         = require('tls')
  , ur          = require('url')
  , zlib        = require("zlib")
  ;


const STATES = { UNCONNECTED: 0, CONNECTING: 1, CONNECTED: 2 };


var slice = [].slice;
var config = { transparent: false };
var isSecure = function(req) { return req.client && req.client.pair ? !0 : req.forceSsl ? !0 : !1; };


var routes = {}

routes.cors = function(options){
  options = options || {};
  //[] :____________________
  var _o = options.origins || "*"
    , _m = options.methods || "*"
    , _h = options.headers || "X-Requested-With, Content-Type"
  ;//_________________________________
  return function(req, res, next) {
    res.set("Access-Control-Allow-Origin",  _o);
    res.set("Access-Control-Allow-Methods", _m);
    res.set("Access-Control-Allow-Headers", _h);
    next();
  };
}
routes.proxy = {};
routes.proxy.gateway = function gateway(req, res, next) {
  req.uri = ur.parse(req.url);
  req.uri.port = req.uri.protocol == "http:" ? 80 : 443;
  req.port = req.uri.port;

  var proxyUrl, safeUrl;
  if (isSecure(req)) {
      req.href = "https://" + req.headers["host"] + uri.path;
      req.ssl = true;
      req.port || (req.port = 443);
  } else {
      req.port || (req.port = 80);
      if (config.transparent) {
          req.href = "http://" + req.headers["host"] + req.url;
      } else {
          safeUrl = "";
          proxyUrl = ur.parse(req.url.slice(1));
          safeUrl += proxyUrl.pathname;
          if (proxyUrl.search != null) {
              safeUrl += proxyUrl.search;
          }
          req.url = safeUrl;
          req.port = proxyUrl.port;
          req.href = proxyUrl.href;
      }
  }
  try {
      bodyLogger(req, "request");
  } catch (err) {
      return console.error(err);
  }
  return next();
}


routes.proxy.outBounds = function outBounds(req, res, next) {
  var passed_opts, upstream_processor, upstream_request;
  req.startTime = new Date();
  passed_opts = {
      method: req.method,
      path: req.url,
      host: req.host,
      headers: req.headers,
      port: req.port
  };
  var nm = req.host + req.uri.pathname;

  upstream_processor = function(upstream_res) {
      res.statusCode = upstream_res.statusCode;
      res.headers = upstream_res.headers;
      if (res.headers && res.headers["content-type"] && res.headers["content-type"].search(/(text)|(application)/) >= 0) {
          res.isBinary = false;
      } else {
          res.isBinary = true;
      }
      res.emit("headers", res.headers);
      try {
          bodyLogger(res, "response", nm);
      } catch (err) {
          return console.error(err);
      }
      res.writeHead(res.statusCode, res.headers);
      upstream_res.on("data", function(chunk) {
          res.write(chunk, "binary");
          return res.emit("data", chunk);
      });
      upstream_res.on("end", function(data) {
          res.endTime = new Date();
          res.end(data);
          return res.emit("end");
      });
      upstream_res.on("close", function() {
          return res.emit("close");
      });
      return upstream_res.on("error", function(err) {
          console.error("Upstream Response Error - " + err);
          return res.emit("close");
      });
  };
  req.on("data", function(chunk) {
      return upstream_request.write(chunk);
  });
  req.on("error", function(err) {
      return console.error("ERROR: " + err);
  });
  upstream_request = req.ssl ? https.request(passed_opts, upstream_processor) : http.request(passed_opts, upstream_processor);
  upstream_request.on("error", function(err) {
      console.error("Upstream Fail - " + req.method + " - " + req.href);
      return console.error(err);
  });
  return upstream_request.end();
}


function bodyLogger(stream, type, nm, callback) {
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
      stream.emit("body");
      if (type === "response") {
          if (stream.statusCode >= 200 && stream.statusCode < 300) {
          }
          return console.info("Captured " + stream.body.length + " bytes from " + stream.statusCode);
      }
  });
  length = parseInt(stream.headers["content-length"], 10) || 0;
  stream.body = new Buffer(parseInt(stream.headers["content-length"], 10));
  stream.length = 0;
  var unzipper = zlib.createUnzip();
  unzipper.on("data", function(datum) {
      data.push(datum);
      return stream.length += datum.length;
  });
  unzipper.on("end", function() {
      return callback();
  });
  unzipper.destroy = function() {
      return console.info(stream.headers);
  };
  switch (stream.headers["content-encoding"]) {
    case "gzip":
      console.info("Unzipping");
      try {
          stream.pipe(unzipper);
      } catch (err) {
          return console.error(err);
      }
      break;

    case "deflate":
      console.info("Deflating");
      try {
          stream.pipe(unzipper);
      } catch (err) {
          return console.error(err);
      }
      break;

    default:
      stream.on("data", function(datum) {
          data.push(datum);
          return stream.length += datum.length;
      });
      stream.on("end", function() {
          return callback();
      });
      break;
  }
}

var app = express();
var ssl = express();


app.configure(function(){
  app.set('port', process.env.PORT || 8001);
  app.use(express.logger('dev'));
  app.use(routes.cors());
});

app.all("*", [routes.cors(), routes.proxy.gateway, routes.proxy.outBounds]);


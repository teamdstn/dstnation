var express     = require('express')
  , routes      = require('./routes')
  , user        = require('./routes/user')
  , http        = require('http')
  , path        = require('path')
  , fs          = require('fs')
  , net         = require('net')
  , tls         = require('tls')
  , $u          = require('./lib/utils')
  , trace       = require('./lib/trace')
  , uparse      = require('url').parse
  , credential  = require('./lib/credential')
  , zlib        = require("zlib")
  ;

var app = express();
const STATES = { UNCONNECTED: 0, CONNECTING: 1, CONNECTED: 2 };

var slice = [].slice;
var config = { transparent: false };
var isSecure = function(req) { return req.client && req.client.pair ? !0 : req.forceSsl ? !0 : !1; };

app.configure(function(){
  app.set('port', process.env.PORT || 8111);

  app.use(express.logger('dev'));
  app.use(function(req, res, next){
    req.uri       = uparse(req.url);
    req.uri.port  = req.uri.protocol == "http:" ? 80 : 443;
    req.port  = req.uri.port;
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    next();
  });


  app.use(function proxyCleanup(req, res, next) {
    var proxyUrl, safeUrl;

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
        proxyUrl = uparse(req.url.slice(1));
        safeUrl += proxyUrl.pathname;
        if (proxyUrl.search != null) {
          safeUrl += proxyUrl.search;
        }
        req.url   = safeUrl;
        req.port  = proxyUrl.port;
        req.href  = proxyUrl.href;
      }
    }
    try { bodyLogger(req, 'request'); }
    catch (err) { return trace.error(err); }

    return next();
  });

  app.use(function outboundProxy(req, res, next) {
    var passed_opts, upstream_processor, upstream_request;
    req.startTime = new Date;
    passed_opts = {
      method  : req.method,
      path    : req.url,
      host    : req.host,
      headers : req.headers,
      port    : req.port
    };

    //console.log(passed_opts)
    var nm = req.host+req.uri.pathname;
    upstream_processor = function(upstream_res) {
      res.statusCode = upstream_res.statusCode;
      res.headers = upstream_res.headers;
      if (res.headers && res.headers['content-type'] && res.headers['content-type'].search(/(text)|(application)/) >= 0) {
        res.isBinary = false;
      } else {
        res.isBinary = true;
      }
      res.emit('headers', res.headers);
      try { bodyLogger(res, 'response', nm); }
      catch (err) { return trace.error(err); }
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
  });

  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

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
    stream.emit('body');
    if (type === 'response') {
      if(stream.statusCode >= 200 && stream.statusCode < 300){
        console.log("res===>", nm)
      }

      return trace.info("Captured " + stream.body.length + " bytes from " + stream.statusCode);
    }
  });

  length = parseInt(stream.headers['content-length'], 10) || 0;
  stream.body = new Buffer(parseInt(stream.headers['content-length'], 10));
  stream.length = 0;



  /*
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
        try { stream.pipe(unzipper); }
        catch (err) { return trace.error(err); }
        break;
      case 'deflate':
        trace.info("Deflating");
        try { stream.pipe(unzipper); }
        catch (err) { return trace.error(err); }
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
  */
};

http.createServer(app).listen(app.get('port'), function(){
  console.log("LSTN " + app.get('port'));
});

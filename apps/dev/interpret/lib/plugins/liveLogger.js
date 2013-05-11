
var express = require('express')
  , io      = require('socket.io')
  , https   = require('https')
  , http    = require('http')
  , path    = require('path')
  ;
var ringBuffer    = require('../ringbuffer').create(100)
  , sessionFilter = require('../sessionFilter')
  , log           = require('../trace')
  ;


var config = { debugPort: 8044 }

var currentSocket = null;
var impracticalMimeTypes = /^(image|audio|video)\//;


var createServer = function(callback) {
  var app = express();
  var server = http.createServer(app);
  io = io.listen(server, { "log level": 0 });

  app.configure(function() {
    return app.use(express["static"](__dirname + '/liveLogger/public'));
  });

  app.get('/', function(req, res) {
    var index;
    index = require('fs').readFileSync(__dirname + '/liveLogger/index.html');
    return res.send(index.toString(), 200);
  });

  app.get('/all', function(req, res) {
    var items, request, requestLogs, _i, _len;
    requestLogs = ringBuffer.all(req.params.key);
    if (requestLogs) {
      items = [];
      for (_i = 0, _len = requestLogs.length; _i < _len; _i++) {
        request = requestLogs[_i];
        items.push(shortFormat.apply(this, [request[0], request[1]]));
      }
      return res.send(JSON.stringify(items, 200));
    } else {
      return res.send(JSON.stringify([], 200));
    }
  });

  app.get('/:key', function(req, res) {
    var requestLog;
    requestLog = ringBuffer.retrieve(req.params.key);
    if (requestLog) {
      return res.send(JSON.stringify(longFormat.apply(this, requestLog), 200));
    } else {
      return res.send("Not Found", 404);
    }
  });

  io.sockets.on('connection', function(socket) {
    return currentSocket = socket;
  });

  return server.listen(config.debugPort);
};


exports = module.exports = function(requestFilter, responseFilter) {
  log.info("Starting LiveLogger on " + config.debugPort);
  createServer();
  return function(req, res, next) {
    if (!sessionFilter.matches(requestFilter, req)) {
      next();
      return;
    }
    res.on('body', function() {
      if (sessionFilter.matches(responseFilter, res)) {
        return liveLog(req, res);
      }
    });
    return next();
  };
};
var liveLog = function(req, res) {
  res.mf.logKey = ringBuffer.add([req, res]);
  if (currentSocket) {
    currentSocket.emit('request', {
      request: shortFormat(req, res)
    });
    return currentSocket.broadcast.emit('request', {
      request: shortFormat(req, res)
    });
  }
};
var shortFormat = function(req, res) {
  return {
    id: res.mf.logKey,
    status: res.statusCode,
    url: req.href,
    method: req.method,
    length: res.length,
    time: res.endTime - req.startTime
  };
};
var longFormat = function(req, res) {
  var key, req_headers, requestContent, res_headers, responseContent, val;
  req_headers = (function() {
    var _ref, _results;
    _ref = req.headers;
    _results = [];
    for (key in _ref) {
      val = _ref[key];
      _results.push("" + key + ": " + val);
    }
    return _results;
  })();
  res_headers = (function() {
    var _ref, _results;
    _ref = res.headers;
    _results = [];
    for (key in _ref) {
      val = _ref[key];
      _results.push("" + key + ": " + val);
    }
    return _results;
  })();
  requestContent = req.body.toString('utf-8');
  if (!(res.headers['content-type'] && res.headers['content-type'].match(impracticalMimeTypes))) {
    responseContent = res.body.toString('utf-8');
  }
  return {
    request: {
      url: req.href,
      method: req.method,
      headers: req_headers,
      content: requestContent
    },
    response: {
      status: res.statusCode,
      headers: res_headers,
      content: responseContent
    },
    time: res.endTime - req.startTime
  };
};


/*
var bodyParser = require("connect/lib/middleware/bodyParser")
  , restreamer = require("connect-restreamer");

require("http-proxy").createServer(bodyParser(), require("connect-restreamer")(), function(req, res, proxy) {}).listen(80);
var options = {
    modify: function(body) {
        return body;
    },
    property: "body",
    stringify: JSON.stringify
};
require("connect-restreamer")(options);



var multipart = require("./multipart"), urlencoded = require("./urlencoded"), json = require("./json");

exports = module.exports = function bodyParser(options) {
    var _urlencoded = urlencoded(options), _multipart = multipart(options), _json = json(options);
    return function bodyParser(req, res, next) {
        _json(req, res, function(err) {
            if (err) return next(err);
            _urlencoded(req, res, function(err) {
                if (err) return next(err);
                _multipart(req, res, next);
            });
        });
    };
};
*/

module.exports = function (bodyParser, options) {
  options = options || {}
  options.property = options.property || 'body'
  options.stringify = options.stringify || JSON.stringify

  return bodyParser()

  return function (req, res, next) {

    req.removeAllListeners('data')
    req.removeAllListeners('end')
    next()
    process.nextTick(function () {
      if(req[options.property]) {
        if('function' === typeof options.modify)
          req[options.property] = options.modify(req[options.property])
        req.emit('data', options.stringify(req.body))
      }
      req.emit('end')
    })
  }
}
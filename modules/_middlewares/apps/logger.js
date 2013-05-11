var bytes = require("../../bytes");
var buf = [];
var defaultBufferDuration = 1e3;

exports = module.exports = function logger(options) {
  if ("object" == typeof options) {
    options = options || {};
  } else if (options) {
    options = {
      format: options
    };
  } else {
    options = {};
  }
  var immediate = options.immediate;
  var fmt = exports[options.format] || options.format || exports.
  default;
  if ("function" != typeof fmt) fmt = compile(fmt);
  var stream = options.stream || process.stdout,
    buffer = options.buffer;
  if (buffer) {
    var realStream = stream,
      interval = "number" == typeof buffer ? buffer : defaultBufferDuration;
    setInterval(function () {
      if (buf.length) {
        realStream.write(buf.join(""), "ascii");
        buf.length = 0;
      }
    }, interval);
    stream = {
      write: function (str) {
        buf.push(str);
      }
    };
  }
  return function logger(req, res, next) {
    req._startTime = new Date();
    if (immediate) {
      var line = fmt(exports, req, res);
      if (null == line) return;
      stream.write(line + "\n", "ascii");
    } else {
      var end = res.end;
      res.end = function (chunk, encoding) {
        res.end = end;
        res.end(chunk, encoding);
        var line = fmt(exports, req, res);
        if (null == line) return;
        stream.write(line + "\n", "ascii");
      };
    }
    next();
  };
};

function compile(fmt) {
  fmt = fmt.replace(/"/g, '\\"');
  var js = '  return "' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function (_, name, arg) {
    return '"\n    + (tokens["' + name + '"](req, res, "' + arg + '") || "-") + "';
  }) + '";';
  return new Function("tokens, req, res", js);
}

exports.token = function (name, fn) {
  exports[name] = fn;
  return this;
};

exports.format = function (name, str) {
  exports[name] = str;
  return this;
};

exports.format("default", ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
exports.format("short",   ":remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms");
exports.format("tiny",    ":method :url :status :res[content-length] - :response-time ms");

exports.format("dev", function (tokens, req, res) {
  var status = res.statusCode,
    len = parseInt(res.getHeader("Content-Length"), 10),
    color = 32;
  if (status >= 500) color = 31;
  else if (status >= 400) color = 33;
  else if (status >= 300) color = 36;
  len = isNaN(len) ? "" : len = " - " + bytes(len);
  return "[90m" + req.method + " " + req.originalUrl + " " + "[" + color + "m" + res.statusCode + " [90m" + (new Date() - req._startTime) + "ms" + len + "[0m";
});

exports.token("url", function (req) {
  return req.originalUrl || req.url;
});
exports.token("method", function (req) {
  return req.method;
});
exports.token("response-time", function (req) {
  return new Date() - req._startTime;
});
exports.token("date", function () {
  return new Date().toUTCString();
});
exports.token("status", function (req, res) {
  return res.statusCode;
});
exports.token("referrer", function (req) {
  return req.headers["referer"] || req.headers["referrer"];
});
exports.token("remote-addr", function (req) {
  return req.socket && (req.socket.remoteAddress || req.socket.socket && req.socket.socket.remoteAddress);
});
exports.token("http-version", function (req) {
  return req.httpVersionMajor + "." + req.httpVersionMinor;
});
exports.token("user-agent", function (req) {
  return req.headers["user-agent"];
});
exports.token("req", function (req, res, field) {
  return req.headers[field.toLowerCase()];
});
exports.token("res", function (req, res, field) {
  return (res._headers || {})[field.toLowerCase()];
});

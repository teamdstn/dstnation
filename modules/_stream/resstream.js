//[DEPENDENCE] :_________________________________
var EventEmitter  = require("events").EventEmitter
  , zlib          = require('zlib')
  , through       = require('./lib/through')
  , Negotiator    = require('./lib/negotiator')
  , Stream        = require('stream')
;//_______________________________________________
//[EXPORTS] :_____________________________________

;//_______________________________________________
//[UTILITY] :_____________________________________

;//_______________________________________________


var res = exports = module.exports = function (src) {
  var dst = null;
  var stream = copyStream(src);
  var pipe = stream.pipe;
  stream.pipe = function (target) {
    if (target && target.writeHead && target.setHeader) {
        dst = target;
        if (target.statusCode === 200) {
            target.statusCode = stream.statusCode;
        }
        stream.__defineGetter__('statusCode', function (code) {
            return target.statusCode;
        });
        stream.__defineSetter__('statusCode', function (code) {
            target.statusCode = code;
        });
        proxied.forEach(function (p) {
            target[p.name].apply(target, p.arguments);
        });
        stream.emit('response', target);
    }
    return pipe.apply(this, arguments);
  };
  stream.statusCode = 200;
  var proxied = [];
  var methods = [ 'writeContinue', 'writeHead', 'setHeader', 'sendDate', 'getHeader','removeHeader', 'addTrailers' ];
  methods.forEach(function (name) {
      stream[name] = function () {
          var prevented = false;
          var prevent = function () { prevented = true };
          stream.emit(name, arguments, prevent);
          if (prevented) return;
          if (dst) return dst[name].apply(dst, arguments);
          // return codes can't work yet here because we don't have the
          // response, but that should only matter for getHeader()
          proxied.push({ name : name, arguments : arguments });
      };
  });
  return stream;
};

function copyStream (src) {
  var s = new Stream;
  s.writable = true;
  s.readable = true;
  [ 'write', 'end', 'destroy', 'pause', 'resume' ].forEach(function (name) { if (src[name]) s[name] = src[name].bind(src); });
  [ 'data', 'end', 'error', 'close', 'drain', 'pipe' ].forEach(function (name) { src.on(name, s.emit.bind(s, name)); });
  return s;
}

exports.oppressor = function (req) {
  var negotiator = new Negotiator(req);
  var enc = negotiator.preferredEncodings([ 'gzip', 'compress', 'identity' ]);
  console.log(enc);
  if (Array.isArray(enc)) enc = enc[0];
  var createStream = { gzip : zlib.createGzip, compress : zlib.createDeflate, identity : through, }[enc] || through;
  var stream = res(createStream());
  stream.on('setHeader', function (args, prevent) {
    if (String(args[0]).toLowerCase() === 'content-length') {
        prevent();
    }
  });
  stream.on('writeHead', function (args, prevent) {
        console.log("writeHead");
    if (!args[0] || typeof args[0] !== 'object') return;
    Object.keys(args[1]).forEach(function (key) {
        console.log(key);
        if (String(key).toLowerCase() === 'content-length') {
            delete args[0][key];
        }
    });
  });
  stream.on('response', function (res) {
  console.log("response");
    if (!res._headers || res._headers['content-encoding'] === undefined) {
      res.setHeader('content-encoding', enc);
    }
    res.removeHeader('content-length');
  });
  return stream;
};
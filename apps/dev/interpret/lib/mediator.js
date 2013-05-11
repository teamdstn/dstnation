var net         = require('net')
  , tls         = require('tls')
  , http        = require('http')
  , https       = require('https')
  , $u          = require('./utils')
  , Proxy       = require('./proxy').Proxy
  , credential  = require('./credential')
  , trace       = require('./trace')
  , debug       = require('debug')('connect:dispatcher');

const STATES = { UNCONNECTED: 0, CONNECTING: 1, CONNECTED: 2 };

var env = process.env.NODE_ENV || 'development';
var slice = [].slice;
exports.create = function() {
  return new Mediator(1 <= arguments.length ? slice.call(arguments, 0) : []);
};

var Mediator = exports.Mediator = (function(_super) {
  $u.extends(Mediator, _super);

  function Mediator() {
    return Mediator.__super__.constructor.apply(this, arguments);
  }

  Mediator.prototype.secure = function(headers, soc) {
    var host, match, port, self = this;
    match = headers.match("CONNECT +([^:]+):([0-9]+).*");
    host = match[1];
    port = match[2];

    return credential.build(host, null, function(err, tlsContext) {
      var cleartext, httpServer, pair;
      pair = tls.createSecurePair(tlsContext, true, false, false);
      pair.on('error', function(err) {
        return trace.error(err);
      });
      httpServer = new http.Server;
      httpServer.on('request', self.handle);
      cleartext = pipe(pair, soc);
      http._connectionListener.call(self, cleartext);
      self.httpAllowHalfOpen = false;
      return soc.write("HTTP/1.0 200 Connection established\r\nMediator-agent: TeamDstn\r\n\r\n");
    });
  };

  Mediator.prototype.http = function(headers, soc) {
    var httpServer = new http.Server;
    httpServer.on('request', this.handle);
    http._connectionListener.call(this, soc);
    return this.httpAllowHalfOpen = false;
  };

  Mediator.prototype.https = function(headers, soc) {
    var httpsServer = new https.Server;
    httpsServer.on('request', this.handle);
    https._connectionListener.call(this, soc);
    return this.httpsAllowHalfOpen = false;
  };

  Mediator.prototype.listen = function(port){
    port = port || 8001;
    var self = this;
    self.proxy = require("./proxy");
    var server = net.createServer(function(soc) {
      var data = [], headers = '', state = STATES.UNCONNECTED;
      soc.on('connect', function() {
        return state = STATES.CONNECTING;
      });
      return soc.on('data', function(data) {
        if (state !== STATES.CONNECTED) {
          headers += data.toString();
          if (headers.match("\r\n\r\n")) {
            state = STATES.CONNECTED;
            if (headers.match(/^CONNECT/)) {
              return self.secure(headers, soc);
            } else {
              return self.http(headers, soc);
            }
          }
        }
      });
    });
    return server.listen(port);
  };
  return Mediator;

})(Proxy);

var pipe = function(pair, socket) {
  var cleartext, onclose, onerror, ontimeout;

  pair.encrypted.pipe(socket);
  socket.pipe(pair.encrypted);
  pair.fd = socket.fd;
  cleartext = pair.cleartext;
  cleartext.socket = socket;
  cleartext.encrypted = pair.encrypted;
  cleartext.authorized = false;

  onerror = function(e) {
    if (cleartext._controlReleased) {
      return cleartext.emit('error', e);
    }
  };

  onclose = function() {
    socket.removeListener('error', onerror);
    socket.removeListener('close', onclose);
    return socket.removeListener('timeout', ontimeout);
  };

  ontimeout = function() {
    return cleartext.emit('timeout');
  };

  socket.on('error', onerror);
  socket.on('close', onclose);
  socket.on('timeout', ontimeout);

  return cleartext;
};

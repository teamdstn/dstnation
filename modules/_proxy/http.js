//[DEPENDENCE] :_________________________________
var events      = require("events")
  , util        = require("util")
  , http        = require("http")
  , httpProxy   = require("../proxy")
;//______________________________________________


var HttpProxy = exports.HttpProxy = function(options) {
  if (!options || !options.target) {
    throw new Error("Both `options` and `options.target` are required.");
  }
  events.EventEmitter.call(this);
  var self = this;
  this.forward = options.forward;
  this.target = options.target;
  function setupProxy(key) {
    self[key].agent = httpProxy._getAgent(self[key]);
    self[key].protocol = httpProxy._getProtocol(self[key]);
    self[key].base = httpProxy._getBase(self[key]);
  }
  setupProxy("target");
  if (this.forward) {
    setupProxy("forward");
  }
  this.enable = options.enable || {};
  this.enable.xforward = typeof this.enable.xforward === "boolean" ? this.enable.xforward : true;
  this.source = options.source || {
    host: "localhost",
    port: 8e3
  };
  this.source.https = this.source.https || options.https;
  this.changeOrigin = options.changeOrigin || false;
};

util.inherits(HttpProxy, events.EventEmitter);

function getProto(req) {
  return req.isSpdy ? "https" : req.connection.pair ? "https" : "http";
}

HttpProxy.prototype.proxyRequest = function(req, res, buffer) {
  var self = this, errState = false, outgoing = new this.target.base(), reverseProxy;
  if (this.enable.xforward && req.connection && req.socket) {
    if (req.headers["x-forwarded-for"]) {
      var addressToAppend = "," + req.connection.remoteAddress || req.socket.remoteAddress;
      req.headers["x-forwarded-for"] += addressToAppend;
    } else {
      req.headers["x-forwarded-for"] = req.connection.remoteAddress || req.socket.remoteAddress;
    }
    if (req.headers["x-forwarded-port"]) {
      var portToAppend = "," + req.connection.remotePort || req.socket.remotePort;
      req.headers["x-forwarded-port"] += portToAppend;
    } else {
      req.headers["x-forwarded-port"] = req.connection.remotePort || req.socket.remotePort;
    }
    if (req.headers["x-forwarded-proto"]) {
      var protoToAppend = "," + getProto(req);
      req.headers["x-forwarded-proto"] += protoToAppend;
    } else {
      req.headers["x-forwarded-proto"] = getProto(req);
    }
  }
  this.emit("start", req, res, this.target);
  if (this.forward) {
    this.emit("forward", req, res, this.forward);
    this._forwardRequest(req);
  }
  function proxyError(err) {
    errState = true;
    if (self.emit("proxyError", err, req, res)) {
      return;
    }
    res.writeHead(500, {
      "Content-Type": "text/plain"
    });
    if (req.method !== "HEAD") {
      if (process.env.NODE_ENV === "production") {
        res.write("Internal Server Error");
      } else {
        res.write("An error has occurred: " + JSON.stringify(err));
      }
    }
    try {
      res.end();
    } catch (ex) {
      console.error("res.end error: %s", ex.message);
    }
  }
  outgoing.host = this.target.host;
  outgoing.hostname = this.target.hostname;
  outgoing.port = this.target.port;
  outgoing.agent = this.target.agent;
  outgoing.method = req.method;
  outgoing.path = req.url;
  outgoing.headers = req.headers;
  if (this.changeOrigin) {
    outgoing.headers.host = this.target.host + ":" + this.target.port;
  }
  reverseProxy = this.target.protocol.request(outgoing, function(response) {



    if (response.headers.connection) {
      if (req.headers.connection) {
        response.headers.connection = req.headers.connection;
      } else {
        response.headers.connection = "close";
      }
    }
    if (req.httpVersion === "1.0") {
      delete response.headers["transfer-encoding"];
    }
    if (response.statusCode === 301 || response.statusCode === 302) {
      if (self.source.https && !self.target.https) {
        response.headers.location = response.headers.location.replace(/^http\:/, "https:");
      }
      if (self.target.https && !self.source.https) {
        response.headers.location = response.headers.location.replace(/^https\:/, "http:");
      }
    }
    res.writeHead(response.statusCode, response.headers);
    if (response.statusCode === 304) {
      try {
        res.end();
      } catch (ex) {
        console.error("res.end error: %s", ex.message);
      }
      return;
    }
    function ondata(chunk) {
      if (res.writable) {

            console.log(String(chunk));


        if (false === res.write(chunk) && response.pause) {
          response.pause();
        }
      }
    }
    response.on("data", ondata);
    function ondrain() {
      if (response.readable && response.resume) {
        response.resume();
      }
    }
    res.on("drain", ondrain);
    var ended = false;
    response.on("close", function() {
      if (!ended) {
        response.emit("end");
      }
    });
    response.on("end", function() {
      ended = true;
      if (!errState) {
        reverseProxy.removeListener("error", proxyError);
        try {
          res.end();
        } catch (ex) {
          console.error("res.end error: %s", ex.message);
        }
        self.emit("end", req, res);
      }
    });
  });
  reverseProxy.once("error", proxyError);
  req.on("aborted", function() {
    reverseProxy.abort();
  });
  req.on("data", function(chunk) {
    if (!errState) {
      var flushed = reverseProxy.write(chunk);
      if (!flushed) {
        req.pause();
        reverseProxy.once("drain", function() {
          try {
            req.resume();
          } catch (er) {
            console.error("req.resume error: %s", er.message);
          }
        });
        setTimeout(function() {
          reverseProxy.emit("drain");
        }, 100);
      }
    }
  });
  req.on("end", function() {
    if (!errState) {
      reverseProxy.end();
    }
  });
  req.on("close", function() {
    if (!errState) {
      reverseProxy.abort();
    }
  });
  if (buffer) {
    return !errState ? buffer.resume() : buffer.destroy();
  }
};

HttpProxy.prototype.proxyWebSocketRequest = function(req, socket, head, buffer) {
  var self = this, outgoing = new this.target.base(), listeners = {}, errState = false, CRLF = "\r\n";
  if (req.method !== "GET" || req.headers.upgrade.toLowerCase() !== "websocket") {
    return socket.destroy();
  }
  if (this.enable.xforward && req.connection && req.connection.socket) {
    if (req.headers["x-forwarded-for"]) {
      var addressToAppend = "," + req.connection.remoteAddress || req.connection.socket.remoteAddress;
      req.headers["x-forwarded-for"] += addressToAppend;
    } else {
      req.headers["x-forwarded-for"] = req.connection.remoteAddress || req.connection.socket.remoteAddress;
    }
    if (req.headers["x-forwarded-port"]) {
      var portToAppend = "," + req.connection.remotePort || req.connection.socket.remotePort;
      req.headers["x-forwarded-port"] += portToAppend;
    } else {
      req.headers["x-forwarded-port"] = req.connection.remotePort || req.connection.socket.remotePort;
    }
    if (req.headers["x-forwarded-proto"]) {
      var protoToAppend = "," + (req.connection.pair ? "wss" : "ws");
      req.headers["x-forwarded-proto"] += protoToAppend;
    } else {
      req.headers["x-forwarded-proto"] = req.connection.pair ? "wss" : "ws";
    }
  }
  function _socket(socket, keepAlive) {
    socket.setTimeout(0);
    socket.setNoDelay(true);
    if (keepAlive) {
      if (socket.setKeepAlive) {
        socket.setKeepAlive(true, 0);
      } else if (socket.pair.cleartext.socket.setKeepAlive) {
        socket.pair.cleartext.socket.setKeepAlive(true, 0);
      }
    }
  }
  _socket(socket, true);
  function onUpgrade(reverseProxy, proxySocket) {
    if (!reverseProxy) {
      proxySocket.end();
      socket.end();
      return;
    }
    proxySocket.on("data", listeners.onIncoming = function(data) {
      if (reverseProxy.incoming.socket.writable) {
        try {
          self.emit("websocket:outgoing", req, socket, head, data);
          var flushed = reverseProxy.incoming.socket.write(data);
          if (!flushed) {
            proxySocket.pause();
            reverseProxy.incoming.socket.once("drain", function() {
              try {
                proxySocket.resume();
              } catch (er) {
                console.error("proxySocket.resume error: %s", er.message);
              }
            });
            setTimeout(function() {
              reverseProxy.incoming.socket.emit("drain");
            }, 100);
          }
        } catch (ex) {
          detach();
        }
      }
    });
    reverseProxy.incoming.socket.on("data", listeners.onOutgoing = function(data) {
      try {
        self.emit("websocket:incoming", reverseProxy, reverseProxy.incoming, head, data);
        var flushed = proxySocket.write(data);
        if (!flushed) {
          reverseProxy.incoming.socket.pause();
          proxySocket.once("drain", function() {
            try {
              reverseProxy.incoming.socket.resume();
            } catch (er) {
              console.error("reverseProxy.incoming.socket.resume error: %s", er.message);
            }
          });
          setTimeout(function() {
            proxySocket.emit("drain");
          }, 100);
        }
      } catch (ex) {
        detach();
      }
    });
    function detach() {
      proxySocket.destroySoon();
      proxySocket.removeListener("end", listeners.onIncomingClose);
      proxySocket.removeListener("data", listeners.onIncoming);
      reverseProxy.incoming.socket.destroySoon();
      reverseProxy.incoming.socket.removeListener("end", listeners.onOutgoingClose);
      reverseProxy.incoming.socket.removeListener("data", listeners.onOutgoing);
    }
    proxySocket.on("end", listeners.onIncomingClose = function() {
      detach();
      self.emit("websocket:end", req, socket, head);
    });
    reverseProxy.incoming.socket.on("end", listeners.onOutgoingClose = function() {
      detach();
    });
  }
  function getPort(port) {
    port = port || 80;
    return port - 80 === 0 ? "" : ":" + port;
  }
  var agent = this.target.agent, protocolName = this.target.https ? "https" : "http", portUri = getPort(this.source.port), remoteHost = this.target.host + portUri;
  if (this.changeOrigin) {
    req.headers.host = remoteHost;
    req.headers.origin = protocolName + "://" + remoteHost;
  }
  outgoing.host = this.target.host;
  outgoing.port = this.target.port;
  outgoing.agent = agent;
  outgoing.method = "GET";
  outgoing.path = req.url;
  outgoing.headers = req.headers;
  outgoing.agent = agent;
  var reverseProxy = this.target.protocol.request(outgoing);
  function proxyError(err) {
    reverseProxy.destroy();
    process.nextTick(function() {
      socket.destroy();
    });
    self.emit("webSocketProxyError", req, socket, head);
  }
  reverseProxy.incoming = {
    request: req,
    socket: socket,
    head: head
  };
  reverseProxy.on("upgrade", function(_, remoteSocket, head) {
    _socket(remoteSocket, true);
    onUpgrade(remoteSocket._httpMessage, remoteSocket);
  });
  reverseProxy.once("socket", function(revSocket) {
    revSocket.on("data", function handshake(data) {
      var sdata = data.toString();
      sdata = sdata.substr(0, sdata.search(CRLF + CRLF));
      data = data.slice(Buffer.byteLength(sdata), data.length);
      if (self.source.https && !self.target.https) {
        sdata = sdata.replace("ws:", "wss:");
      }
      try {
        self.emit("websocket:handshake", req, socket, head, sdata, data);
        socket.write(sdata);
        var flushed = socket.write(data);
        if (!flushed) {
          revSocket.pause();
          socket.once("drain", function() {
            try {
              revSocket.resume();
            } catch (er) {
              console.error("reverseProxy.socket.resume error: %s", er.message);
            }
          });
          setTimeout(function() {
            socket.emit("drain");
          }, 100);
        }
      } catch (ex) {
        revSocket.removeListener("data", handshake);
        return proxyError(ex);
      }
      socket.on("error", proxyError);
      revSocket.removeListener("data", handshake);
    });
  });
  reverseProxy.on("error", proxyError);
  try {
    reverseProxy.write(head);
    if (head && head.length === 0) {
      reverseProxy._send("");
    }
  } catch (ex) {
    return proxyError(ex);
  }
  if (buffer) {
    return !errState ? buffer.resume() : buffer.destroy();
  }
};

HttpProxy.prototype.close = function() {
  [ this.forward, this.target ].forEach(function(proxy) {
    if (proxy && proxy.agent) {
      for (var host in proxy.agent.sockets) {
        proxy.agent.sockets[host].forEach(function(socket) {
          socket.end();
        });
      }
    }
  });
};

HttpProxy.prototype._forwardRequest = function(req) {
  var self = this, outgoing = new this.forward.base(), forwardProxy;
  outgoing.host = this.forward.host;
  outgoing.port = this.forward.port, outgoing.agent = this.forward.agent;
  outgoing.method = req.method;
  outgoing.path = req.url;
  outgoing.headers = req.headers;
  forwardProxy = this.forward.protocol.request(outgoing, function(response) {});
  forwardProxy.once("error", function(err) {});
  req.on("data", function(chunk) {
    var flushed = forwardProxy.write(chunk);
    if (!flushed) {
      req.pause();
      forwardProxy.once("drain", function() {
        try {
          req.resume();
        } catch (er) {
          console.error("req.resume error: %s", er.message);
        }
      });
      setTimeout(function() {
        forwardProxy.emit("drain");
      }, 100);
    }
  });
  req.on("end", function() {
    forwardProxy.end();
  });
};
var tls = require("tls"),
  net = require("net"),
  url = require("url"),
  qs = require("querystring"),
  crypto = require("crypto"),
  http = require("http"),
  HTTPParser = process.binding("http_parser").HTTPParser,
  inherits = require("util").inherits;

var parsers = http.parsers;

function createConnection(port, host, options) {
  var s;
  if (options.proxy) {
    s = clearTextSocket(port, host, options);
  } else {
    s = tls.connect(port, host, options);
  }
  return s;
}
function Agent(options) {
  http.Agent.call(this, options);
  this.createConnection = createConnection;
}
inherits(Agent, http.Agent);
Agent.prototype.defaultPort = 443;
var Connection = process.binding("crypto").Connection;
function clearTextSocket(port, host, options) {
  var sslcontext = crypto.createCredentials({});
  var pair = tls.createSecurePair(sslcontext, false);
  var cleartext = pair.cleartext;
  pair.ssl = null;
  pair._doneFlag = true;
  var socket = encryptedSocket(host, port, options, function () {
    pair.encrypted.pipe(socket);
    socket.pipe(pair.encrypted);
    pair.fd = socket.fd;
    pair.ssl = new Connection(sslcontext.context, false, false, false);
    pair.ssl.start();
    pair._doneFlag = false;
    pair.cycle();
  });
  function onerror(e) {
    if (cleartext._controlReleased) {
      cleartext.emit("error", e);
    }
  }
  function onclose() {
    socket.removeListener("error", onerror);
    socket.removeListener("close", onclose);
    socket.removeListener("timeout", ontimeout);
  }
  function ontimeout() {
    cleartext.emit("timeout");
  }
  socket.on("error", onerror);
  socket.on("close", onclose);
  socket.on("timeout", ontimeout);
  cleartext._controlReleased = true;
  return cleartext;
}
function encryptedSocket(host, port, options, cb) {
  var connectHeaders = {
    "Proxy-Connection": "keep-alive",
    Host: host
  };
  var proxy = options.proxy;
  if (typeof proxy == "string") proxy = url.parse(proxy);
  if (proxy.auth) {
    connectHeaders["Proxy-Authorization"] = "Basic " + new Buffer(proxy.auth.split(":").map(function (i) {
      return qs.unescape(i);
    }).join(":"), "ascii").toString("base64");
  }
  var response = "";
  var socket = net.createConnection(proxy.port || 3128, proxy.hostname || "127.0.0.1");
  var parser = parsers.alloc(parser);
  parser.reinitialize(HTTPParser.RESPONSE);
  parser.socket = socket;
  parser.incoming = null;
  socket.on("connect", function () {
    var headers = [];
    headers.push("CONNECT " + host + ":" + port + " HTTP/1.1");
    for (var key in connectHeaders) {
      headers.push([key, ": ", connectHeaders[key]].join(""));
    }
    socket.write(headers.join("\n") + "\n\n");
  });
  socket.ondata = function (data, start, end) {
    var ret = parser.execute(data, start, end - start);
    if (ret instanceof Error) {
      socket.destroy(ret);
    }
  };
  parser.onIncoming = function (res) {
    if (res.statusCode != 200) {
      socket.destroy(new Error("CONNECT did not return status 200"));
    } else {
      socket.ondata = null;
      socket.removeAllListeners("close");
      parsers.free(parser);
      parser = null;
      if (cb) cb();
    }
  };
  socket.on("close", function () {
    if (parser) {
      parsers.free(parser);
      parser = null;
    }
  });
  return socket;
}
var globalAgents = {
  "null": new Agent()
};
exports.globalAgent = globalAgents[null];
exports.Agent = Agent;
exports.request = function (options, cb) {
  if (options.protocol && options.protocol !== "https:") {
    throw new Error("Protocol:" + options.protocol + " not supported.");
  }
  if (options.agent === undefined) {
    var key = options.proxy || null;
    if (key && typeof key === "object") {
      key = url.format(key);
    }
    if (!globalAgents[key]) {
      globalAgents[key] = new Agent({
        proxy: options.proxy
      });
    }
    options.agent = globalAgents[key];
  }
  options.createConnection = createConnection;
  options.defaultPort = options.defaultPort || 443;
  return new http.ClientRequest(options, cb);
};
exports.get = function (options, cb) {
  options.method = "GET";
  var req = exports.request(options, cb);
  req.end();
  return req;
};

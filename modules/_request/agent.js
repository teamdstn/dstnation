//[] :____________________
var net       = require('net')
  , tls       = require('tls')
  , Agent     = require('http').Agent
  , AgentSSL  = require('https').Agent
;//_________________________________
exports = module.exports = ForeverAgent;
exports.SSL = ForeverAgentSSL;

var inherits = function(ctor,stor){ctor.super_ = stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}

function ForeverAgent(options) {
    var self = this;
    self.options = options || {};
    self.requests = {};
    self.sockets = {};
    self.freeSockets = {};
    self.maxSockets = self.options.maxSockets || Agent.defaultMaxSockets;
    self.minSockets = self.options.minSockets || ForeverAgent.defaultMinSockets;
    self.on("free", function(socket, host, port) {
        var name = host + ":" + port;
        if (self.requests[name] && self.requests[name].length) {
            self.requests[name].shift().onSocket(socket);
        } else if (self.sockets[name].length < self.minSockets) {
            if (!self.freeSockets[name]) self.freeSockets[name] = [];
            self.freeSockets[name].push(socket);
            function onIdleError() {
                socket.destroy();
            }
            socket._onIdleError = onIdleError;
            socket.on("error", onIdleError);
        } else {
            socket.destroy();
        }
    });
}

inherits(ForeverAgent, Agent);

ForeverAgent.defaultMinSockets = 5;
ForeverAgent.prototype.createConnection   = net.createConnection;
ForeverAgent.prototype.addRequestNoreuse  = Agent.prototype.addRequest;

ForeverAgent.prototype.addRequest = function(req, host, port) {
    var name = host + ":" + port;
    if (this.freeSockets[name] && this.freeSockets[name].length > 0 && !req.useChunkedEncodingByDefault) {
        var idleSocket = this.freeSockets[name].pop();
        idleSocket.removeListener("error", idleSocket._onIdleError);
        delete idleSocket._onIdleError;
        req._reusedSocket = true;
        req.onSocket(idleSocket);
    } else {
        this.addRequestNoreuse(req, host, port);
    }
};

ForeverAgent.prototype.removeSocket = function(s, name, host, port) {
    if (this.sockets[name]) {
        var index = this.sockets[name].indexOf(s);
        if (index !== -1) {
            this.sockets[name].splice(index, 1);
        }
    } else if (this.sockets[name] && this.sockets[name].length === 0) {
        delete this.sockets[name];
        delete this.requests[name];
    }
    if (this.freeSockets[name]) {
        var index = this.freeSockets[name].indexOf(s);
        if (index !== -1) {
            this.freeSockets[name].splice(index, 1);
            if (this.freeSockets[name].length === 0) {
                delete this.freeSockets[name];
            }
        }
    }
    if (this.requests[name] && this.requests[name].length) {
        this.createSocket(name, host, port).emit("free");
    }
};

function ForeverAgentSSL(options) {
    ForeverAgent.call(this, options);
}

inherits(ForeverAgentSSL, ForeverAgent);
ForeverAgentSSL.prototype.createConnection  = createConnectionSSL;
ForeverAgentSSL.prototype.addRequestNoreuse = AgentSSL.prototype.addRequest;

function createConnectionSSL(port, host, options) {
    options.port = port;
    options.host = host;
    return tls.connect(options);
}
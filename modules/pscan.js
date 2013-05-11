//[] :_____________________________
var net   = require("net")
  , pkiil = require("./kill")
;//[] :_____________________________
function until(test, iterator, cb) {
  if(test()) return cb();
  iterator(function(err) { if (err) return cb(err); until(test, iterator, cb); });
};
function isFunc(o) { return Object.prototype.toString.call(o) == "[object Function]"; };

exports = module.exports = pscan;
exports.any = function(){
  return Math.floor(Math.random() * 5e4 + 1e4);
}
function pscan(port, host, cb) {
    typeof host === "function" && ((cb = host),(host = null));
    host = host || "localhost";

    var socket = new net.Socket(), status = null;

    socket.on("connect", function() {
        status = "open";
        socket.end();
    });
    socket.setTimeout(280);
    socket.on("timeout", function() {
        status = "closed";
    });
    socket.on("error", function(exception) {
        status = "closed";
    });
    socket.on("close", function(exception) {
        socket.destroy();
        cb && cb(null, status);
    });
    socket.connect(port, host);
};

exports.strict = function(startPort, endPort, host, cb) {
  findAPortWithStatus("strict", startPort, endPort, host, cb);
};

exports.opened = function(startPort, endPort, host, cb) {
  findAPortWithStatus("open", startPort, endPort, host, cb);
};

exports.closed = function(startPort, endPort, host, cb) {
  findAPortWithStatus("closed", startPort, endPort, host, cb);
};

function findAPortWithStatus(status, startPort, endPort, host, cb) {
    host = host || "localhost";
    isFunc(host)    && ((cb = host),(host = "localhost"));
    isFunc(endPort) && ((cb = endPort),(endPort = 65535));
    endPort = endPort || 65535;

    var foundPort     = false, numberOfPortsChecked = 0, port = startPort;
    var hasFoundPort  = function() {
        return foundPort || numberOfPortsChecked === endPort - startPort + 1;
    };
    var checkNextPort = function(cb) {
        pscan(port, host, function(error, statusOfPort) {
            numberOfPortsChecked++;
            if (error) {
                cb(error);
            } else {
              if(status === "strict"){
                if(statusOfPort === "open"){
                  pkiil(port, function(err){
                    foundPort = true;
                    cb(err, port);
                  })
                }else{
                  foundPort = true;
                  cb(null, port);
                }
              } else if (statusOfPort === status) {
                foundPort = true;
                cb(null, port);
              } else {
                port++;
                cb(null, false);
              }
            }
        });
    };
    until(hasFoundPort, checkNextPort, function(error) {
        if (error) {
            cb(error);
        } else if (foundPort) {
            cb(null, port);
        } else {
            cb(null, false);
        }
    });
}
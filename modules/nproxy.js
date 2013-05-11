var net = require('net');
var proxyPort   = 8001;
var parsers     = require('../modules/parsers');

exports = module.exports = nproxy;
function anyport(){ return Math.floor(Math.random() * 5e4 + 1e4); }

var nproxy = function(options){
  options = options || {};
  var _port = options.port || anyport();
  return function(){

    net.createServer(function (socket) {
      var _conn = false
        , _init = false
        , _buff = []
        , _ssoc = socket
        , _csoc = new net.Socket()
      ;//_________________________________
      var connectService = function(err, headers) {
        _conn = true;
        _csoc.connect(headers.uri.protocol === "http:" ? 80 : 80, headers.uri.host, function() {
          _init = true;
          if (_buff.length > 0) {
            for (i = 0; i < _buff.length; i++) {
              _csoc.write(_buff[i]);
            }
          }
        });
      }
      ;//[SER SOCK]________________________
      _ssoc
      .on("data", function (data) {
        if (!_conn) {
          parsers.net(String(data), connectService)
        }
        if (_init) { _csoc.write(data); }
        else { _buff[_buff.length] = data; }
      })
      .on("connect", function () {
        _ssoc.write("\r\n")
      })
      .on("error", function (err) {
        console.error("[31m%s [0m: [31m[1m%s [0m", "SSOC_ERR", err);
        _csoc.end();
      })
      .on("close", function(hadE) {
        _csoc.end();
      })
      ;//[CLI SOCK]________________________
      _csoc
      .on("data", function(data) {
        _ssoc.write(data);
      })
      .on("error", function (err) {
        console.error("[31m%s [0m: [31m[1m%s [0m", "CSOC_ERR", err);
        _ssoc.end();
      })
      .on("close", function(hadE) {
        _ssoc.end();
      })
      ;// _________________________________
    }).listen(_port);


  }
}


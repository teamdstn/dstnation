//[] :_____________________________
var mt = "", ntr = "\r\n", uparse = require("url").parse
;//[] :____________________________
var rxpHttpHeader = [ "(CONNECT) +([^:]+):([0-9]+) (HTTP/[1-9/.]+).*", "(.*): (.*)", "(GET|POST) +([^ ]+) (HTTP/[1-9/.]+).*" ]
  , cleanS = function(s){ return String.prototype.trim.call("" + s.replace(/\n|\r/ig, "").replace(/ +/g, " ")) }
;//[] :____________________________


exports = module.exports = function(str, caf, next) {
  "function"  === typeof caf && ((next=caf),(caf=undefined))
  var _str = str, state, _match, _flag, _tmp, $rst = {
    headers: {},
    state: ""
  };
  if (_str.match(ntr + ntr)) {
    $rst.state = 2;
    _flag = /^CONNECT/.test(_str);
    _match = _flag ? _str.match(rxpHttpHeader[0]) : _str.match(rxpHttpHeader[2]);
    _match.input.split(ntr).forEach(function(o, n) {
      if (o == mt) return;
      o = o.match(rxpHttpHeader[1]);
      o && ($rst.headers[cleanS(o[1]).toLowerCase()] = cleanS(o[2]));
    });
    $rst.url = _flag ? "https://" + _match[2] : _match[2];
    $rst.uri = uparse($rst.url);
    _flag && ($rst.uri.protocol = "https:", $rst.uri.port = _match[3], caf && ($rst.ca = caf));
    $rst.headers.method = _match[1];
    next(null, $rst, str);
  }
};

/*
  //Usege -----
  var datas = {};
  datas.https  = [
                  "CONNECT bodogjob.com:443 HTTP/1.1"
                  ,"Host: bodogjob.com"
                  ,"Proxy-Connection: keep-alive"
                  ,"User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4"
                ]
  ;//__________________________
  datas.http  = [
                  "GET http://nina-d-lux.deviantart.com/gallery/ HTTP/1.1"
                  ,"Host: nina-d-lux.deviantart.com"
                  ,"Proxy-Connection: keep-alive"
                  ,"Cache-Control: max-age=0"
                  ,"User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4"
                  ,"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8"
                  ,"Accept-Encoding: gzip,deflate,sdch"
                  ,"Accept-Language: en-US,en;q=0.8,ko;q=0.6"
                  ,"Accept-Charset: windows-949,utf-8;q=0.7,*;q=0.3"
                  ,"Cookie: __qca=cookie;"
                ]
  ;//__________________________
  function _cb(err, options){
    if(err) return console.error(err);
    console.log(options);
  }
  exports.headers(datas.https.join(ntr) +ntr +ntr, _cb);
  exports.headers(datas.http.join(ntr) +ntr +ntr, _cb);
*/
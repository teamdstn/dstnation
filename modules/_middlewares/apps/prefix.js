//[] :____________________
var extname = require("path").extname
  , gc    = require("../../_natives/gc")
  , parse = require("url").parse
  , keys  = Object.keys
  , mt    = ""
;//_________________________________
function each(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }

var cookie = require("../../cookie")
module.exports = function prefix(options) {
    var _conf   = options.conf
      , _def    = options.ext
      , _white  = options.black || /\.(js|css|swf|gif|png|jpg|jpeg|ico)/
      , _black  = options.black || /\.(js|css|swf|gif|png|jpg|jpeg|ico)/
      , secret  = options.secret
    ;//==============================================

    //console.log(this.static)
    return function prefix(req, res, next) {
      delete res.locals.expose;
      var _ext  = extname(req.url)
        , _pth = req.path.split("/").splice(1)
        , _len = _pth.length
        , _bse = _pth[_len-1] || "ncr"
      ;//___________________

      if(secret && req.cookies === void 0){
        var cookies = req.headers.cookie;
        req.secret = secret;
        req.cookies = {};
        req.signedCookies = {};
        if (cookies) {
          try {
            req.cookies = cookie.parse(cookies);
            if (secret) {
              req.signedCookies = cookie.parseSignedCookies(req.cookies, secret);
              var obj = cookie.parseJSONCookies(req.signedCookies);
              req.signedCookies = obj;
            }
            req.cookies = cookie.parseJSONCookies(req.cookies);
          } catch (err) {
            return next(err);
          }
        }
      }

      //___________________
      if(_white.test(""+_ext)){
        req.exp = false;
        return next();
      }
      //___________________ expose
      var _uri = parse(req.url)
        , _xpt = {}
      ;//________________________________
      req.pathname = _xpt.pathname = _uri.pathname;
      _xpt.base = _bse, _xpt.route = "/";
      if(_xpt.base === "ncr" || _xpt.base === mt){
        _xpt.page = "ncr";
        each(_conf, function(v,k){
          _xpt[k] = req.cookies ? req.cookies[k] || v[0] : v[0];
        })
      }else{
        _xpt.ext = (_xpt.base+_def).split(".")[1];
        if(_len>0){
          each(_conf, function(v,k){

            if(Array.isArray(v) && v.indexOf(_pth[0])>-1){ _xpt[k] =  _pth[0];_pth.shift();
            }else{ _xpt[k] = req.cookies ? req.cookies[k] || v[0] : v[0];}
          });
        }
        _xpt.route = "/" + _pth.join("/");
        _xpt.page = (_pth[0] == void 0 || _pth[0] === mt)? "home": (_pth.join('_')).replace(/-| /g, "_");
      }


      req.exp = {route: _xpt.route};
      _xpt.def = {header:[], widget:[], contents:[]};
      res.locals.expose = gc(_xpt);
      res.locals.expose["set"] = expose;
      //res.locals.expose.set("def:bodies:contents:", "");
      next();
    };
};

function expose(s, p, v) {"string" === typeof s  && (v = p , p = s, s = this), p = p.split(":");
  var k, i; for (i in p) { k = p[i]; if (!s[k]){ s[k] = ((+i + 1 === p.length) ? v : {}); }; s = s[k]; }
}

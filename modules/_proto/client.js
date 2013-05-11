/*!
 * $Package.module
 * Copyright(c) 2010 TeamDstn Inc.
 * Copyright(c) 2012 TeamDstn.Dustin
 * MIT Licensed
 */

//[DEPENDENCE] :_________________________________
var $g      = require("edge")
  , $m      = $g.modules('request domino jvm')
  , fs      = require('fs')
  , exists  = fs.exists
  , http    = require("http")
  , EventEmitter  = require('events').EventEmitter
  , proto, utils, locals
;//_______________________________________________

//[INITIALIZE] :----------------------------------
var env = process.env.NODE_ENV || "development";
//------------------------------------------------

exports = module.exports = create;

var caFile  = $g.resolve(__dirname, 'ssl/ca/ca.crt')
  , ca      = fs.readFileSync(caFile)

function create() {
  function app(err, res, body) {
    //if(err) return console.log(err);
    if(err) return console.log("ERR".red.bold, err);
    app.handle(res.request, res, body);
  }
  exports.utils.merge(app, proto);
  exports.utils.merge(app, EventEmitter.prototype);
  app.request = $m.request.defaults({ca:caFile});





  app.stack = [];

  for (var i = 0; i < arguments.length; ++i) {
    app.use(arguments[i]);
  }
  return app;
}

exports.req         = $m.request;
exports.middleware  = {};

exports.utils = {
  escape    : function(html){ return String(html).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
  merge     : function(a, b){ if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; },
  parsedUrl : function(req){var parsed=req._parsedUrl;return parsed&&parsed.href==req.url?paesed:req._parsedUrl=$g.uparse(req.url)},
  locals    : function(){ return function locals(o){for(var k in o)locals[k]=o[k];return o;} }
};

exports.proto = {

  init : function() {
    var self = this;
    this.cache = {},
    this.settings = {},
    this.defaultConfiguration();
  },

  defaultConfiguration : function() {
    var self = this;
    this.enable("javascript:<");
    this.set("env", process.env.NODE_ENV || "development");

    this.locals = exports.utils.locals(this);
    this.locals.settings = this.settings;

    this.configure("development", function() {
      this.set("json spaces", 2);
    });

    this.configure("production", function() {
      this.enable("view cache");
    });
  },

  use : function(route, fn){
    !$g.isString(route) && (fn=route),(route="/");
    if($g.isFunction(fn.handle)){var server=fn;fn.route=route;fn=function(a,b,c){server.handle(a,b,c)}}
    route[route.length-1]==="/" && (route=route.slice(0,-1));
    this.stack.push({route:route,handle:fn});
    return this;
  },

  get:function(setting){
    return this.settings[setting];
  },

  set : function(setting, val) {
    if (1 == arguments.length) {
      if (this.settings.hasOwnProperty(setting)) {
        return this.settings[setting];
      } else if (this.parent) {
        return this.parent.set(setting);
      }
    } else {
        this.settings[setting] = val;
      return this;
    }
  },

  enabled   : function(setting){ return !!this.set(setting);       },
  disabled  : function(setting){ return  !this.set(setting);       },
  enable    : function(setting){ return   this.set(setting, true); },
  disable   : function(setting){ return   this.set(setting, false);},

  configure : function(env, fn){
    var envs = "all", args = [].slice.call(arguments);
    fn = args.pop();
    if (args.length) envs = args;
    if ("all" == envs || ~envs.indexOf(this.settings.env)) fn.call(this);
    return this;
  },

  handle:function(req, res, body) {
    console.log("handle")
    //console.log(arguments)
    //[] :______________________________
    var stack     = this.stack
      , jqfied    = false
      , index     = 0
    ;//_________________________________
    function next(err) {
      var layer = stack[index++];
      if (!layer || res.ended) {
        if (err) {}
        else {}
        return;
      }
      !jqfied && (body = $m.domino.load(body)),(jqfied=true);
      return layer.handle(req,res,body,next);
    }
    next();
  },

  suit: function(url, options){
    options = options || {};
    //console.log(url)
    return this.request(url, options, this);
  },

  http: function(headers, soc){
    soc.httpsAllowHalfOpen = false;

    var qs = require("querystring");
    var _spt = headers.split("\r\n");
    var _hs  = _spt[0].split(" ");
    var _url = qs.unescape(_hs[1]);
    _url.indexOf("http:")<0 && (_url= "https://"+_url);

    var uu = $g.uparse(_url);
    uu.headers = {method:_hs[0]}
    return this.request(_url, uu, this).pipe(soc);
  },

  https: function(headers, soc){
    console.log("https headers", headers)
    soc.httpsAllowHalfOpen = false;
    this.secure = $m.request.defaults({ca:caFile, followRedirect:false});
    var qs = require("querystring");
    var _spt = headers.split("\r\n");
    var _hs  = _spt[0].split(" ");
    var _url = qs.unescape(_hs[1]);
    _url.indexOf("http:")<0 && (_url= "https://"+_url);

    var uu = $g.uparse(_url);
    uu.headers = {method:_hs[0]}
    return this.secure(_url, uu, this).pipe(soc);
  },



  listen : function(port){
    port = port || 8001;
    var self = this;
    var STATES = { UNCONNECTED: 0, CONNECTING: 1, CONNECTED: 2 };

    var net = require("net");
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

              return self.https(headers, soc);

              //return self.secure(headers, soc);
            } else {


              return self.http(headers, soc);
            }
          }
        }
      });
    });
    return server.listen(port);
  }
};

/**
 * $Function

 * @param {Object} options
 * @return {Function}
 * @api public
 */

(function defineget(modDir){
  fs.readdirSync(modDir).forEach(function(fl) {
    if (!/\.js$/.test(fl)) return;
    var name = $g.basename(fl, ".js");
    function load() { return require(modDir + "/" + name); }
    exports.middleware.__defineGetter__(name, load);
  });
})($g.resolve(__dirname, "middleware"))















/*
http: function(headers, soc){

var httpServer = new http.Server;
httpServer.on('request', function*({);
http._connectionListener.call(this, soc);
return this.httpsAllowHalfOpen = false;



/*
soc.httpsAllowHalfOpen = false;

var qs = require("querystring");
var _spt = headers.split("\r\n");
var _hs  = _spt[0].split(" ");


console.log(qs.unescape(_hs[1]));

//_url = _url.replace("http:","https:");
//console.log("%s".red.bold, _url);
var _url = qs.unescape(_hs[1]);
_url.indexOf("http:")<0 && (_url= "https://"+_url);

var uu = $g.uparse(_url);
uu.headers = {method:_hs[0]}
return this.request(_url, uu, this).pipe(soc);
*/

//var _headers = qs.parse();
//console.log(_headers)
//return this.request(url, options, this);
//return this.request(url, options, this);



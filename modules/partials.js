//[] :____________________
var fs        = require("fs")
  , ur        = require("url")
  , pt        = require("path")
  , domino    = require("./domino")
  , beautify  = require("./beautify")
  , request   = require("./request")
  , chrome    = require("./chrome")
  , nproxy    = require("./nproxy")
  , regex     = require("./regex")
;//_________________________________

var __Array=Array.prototype, __String=String.prototype, __Object=Object.prototype, keys = Object.keys
, each  = function(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }
, trim  = function(s, c) { return String(s).replace(new RegExp('\^' + c + '+|' + c + '+$', 'g'), ''); }
, strin = function(s, n) { n = n.split("|"); for (var i=0, len = n.length; i < len; ++i) { if(String(s).indexOf(n[i]) !== -1){ return true; break; } } return false; }
, is = {"arr": __Array.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
;//_________________________________
each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; });

var rex = [/javascript:([A-Za-z0-9].*)\/?\(([A-Za-z0-9, '"].*)\)/gi , "$1,$2", function(o){return o.replace(/'/gi,'').split(",");}];
function rexexc(str, regext) {
  var _str = str.toLowerCase().replace(regext[0], regext[1]);
  regext.length > 2 && (_str = regext[2](_str));
  return _str;
}
var rnum = 0;
var fnum = 0;
function dirs(irl, src, srl) {
  var rst = {};
  rst.src = ur.resolve(irl, src);
  rst.src = rst.src.replace(/www\./gi, "");

  rst.uri = ur.parse(rst.src);
  rst.pth = pt.normalize(srl + "/" + rst.uri.host + "/" + trim(rst.uri.pathname,"/"));
  rst.pth = rst.pth.replace(/www\./gi, "");
  //console.log("%s"+"\n%j".green+"\n%s".yellow.bold, rst.src, rst.uri, rst.pth);
  return rst;
}
var caches = {
    f : {}
  , h : []
  , e : []
  , hwalk : []
  , ewalk : []
  , hon :""
  , eon :""
  , static:""
  , out :false
  , isLogin: false
  , account: null
  , jar:{}
  , proxy:null
  , sort : function(){
      ["h","e"].forEach(function(o){
        caches[o].sort(1); caches[o+"walk"].sort(1);
      })
    }
}

var blacks = ["riptownmedia"];
function chkHost(dirs, hosts, c) {
  var _c  = caches[c]
    , _w = caches[c+"walk"];
  if(_c.indexOf(dirs.src)>-1) return false;
  if(is.arr(hosts)){


    var _str= dirs.uri.host.split(".");
    for (var i=0, len = _str.length-1; i < len; ++i) {
      if(blacks.indexOf(_str[i])>-1){
        return false;
        break;
      }

      if(hosts.indexOf(_str[i])>-1){
        _c.push(dirs.src);
        _w.push(dirs.src);
        return true;
        break;
      }
    }
  }else{
    _c.push(dirs.src);
    _w.push(dirs.src);
    return true;
  }
  return false;
}

var reqResend = function(resq){
  if(resq || resq.headers.location){
      var _loc = ur.format(resq.request.uri);
      var _reloc = ur.resolve(_loc, resq.headers.location);
      if(caches.h.indexOf(_reloc)<0) {
        _reloc = _reloc.replace(/www\./gi, "");
        console.log("[34m%s [0m: [34m[1m%s [0m", "RED", _reloc);
        caches.h.unshift(_reloc);
        caches.hwalk.unshift(_reloc);
      }

   }
}

var elemently = {
  hosts:  [],
  nameRange : ["name", "account", "id", "username"],
  passRange : ["pass", "password", "pwd"],

  chkswf: function(txt){
    return /swfobject|embedSWF|.swf|flashvars/.test(txt);
  },
  req: function(_dirs){
    var _force = fs.existsSync(_dirs.src);

    if(caches.e.indexOf(_dirs.src)<0 && !_force){
      caches.e.push(_dirs.src);
      try {
        fs.mkdirp.ws(_dirs.pth, function(err, ws){
          if(err) return console.error("EWORK_ERR".red);
          try {
            request(_dirs.uri.href, {proxy:caches.proxy, jar:caches.jar}).on("fail", function(){ ws.del(); }).pipe(ws);
          } catch (err) {
            console.error("EWORK_ERR".red);
          }
          return;
        })
      } catch (err) {
        return console.error("EWORK_ERR".red);
      }
    }
  },
  img : function($, irl, srl) {
    var $o = $("img");
    if(!$o || !$o.length) return;
    for (var i=0, _att, _dirs, len = $o.length; i < len; ++i) {
      _att = $o[i].attribs;
      _dirs = dirs(irl, _att.src, srl);
      elemently.req(_dirs);
    }
  },
  script : function($, irl, srl) {
    var $o = $("script");
    if(!$o || !$o.length) return;
    for (var i=0, _att, _txt, _dirs, len = $o.length; i < len; ++i) {
      _att = $o[i].attribs;
      if (_att.src) {
        _dirs = dirs(irl, _att.src, srl);
        elemently.req(_dirs);
      } else {
        _txt =  $o[i].children;
        if (_txt.length && _txt[0].data && _txt[0].data.length > 8) {

          var _block = /gaJsHost|pageTracker/.test(String(_txt[0].data));
          if (!_block) {
            _data = String(_txt[0].data);
            if(!_data || _data === "")
              return;
            //vm.runInNewContext(_fk, {window: window, getParams:getParams, console:console}, "context.memu");
            if (/swfobject|embedSWF|.swf|flashvars/.test(_data)) {

            }
            if ($o[i].parent.name === "head") {} else {}
          }
        }
      }
    }
    caches.sort(1);
  },
  style : function($, irl, srl) {
    var $o = $("link");
    if(!$o || !$o.length) return;
    for (var i=0, _att, _dirs, len = $o.length; i < len; ++i) {
      _att = $o[i].attribs;
      if (_att.type == "text/css") {
        _dirs = dirs(irl, _att.href, srl);
        elemently.req(_dirs);
      } else {
      }
    }
    caches.sort(1);
  },
  form : function($, irl, srl) {
    var $o = $("form"), forms = caches.f;
    if(!$o || !$o.length) return;
    for (var i=0, _id, _att, _dirs, len = $o.length; i < len; ++i) {
      _att = $o[i].attribs;
      _id = _att.name || _att.id;
      if (_id !== void 0 && !forms.hasOwnProperty(_id)) {
        forms[_id] = {};
        forms[_id].attr = _att;
        forms[_id].url = irl;
        forms[_id].input = {};
        $($o[i]).children("input").each(function(n) {
          var dis = $(this);
          forms[_id].input[dis.attr("name")] = this.attribs;
        });
        if (_id.indexOf("login") > -1 && caches.account) {
          console.log("GT_LOGIN", _id);
          elemently.login(forms[_id], caches.account, irl);
        }
      }
    }
  },
  login : function(frm, account, srl) {
    var _frm = {};
    each(frm.input, function(v, k) {
      if (elemently.nameRange.indexOf(k) > -1) {
        _frm[k] = account["name"];
      } else if (elemently.passRange.indexOf(k) > -1) {
        _frm[k] = account["pass"];
      } else {
        _frm[k] = v.value || "";
      }
    });
    var _url = ur.format(srl, frm.attr["action"]);
    request.post(_url, { form: _frm, followRedirect: false, proxy:caches.proxy, jar:caches.jar}, function(E, R, B) {
      if (R) {
        request(ur.resolve(srl, account.chk.url), {proxy:caches.proxy, jar:caches.jar}, function(E, R, B) {
          caches.isLogin = true;

        })
        if (R.statusCode == 302 && R.headers.location) {
        }
      }
    }).on("redirection", reqResend);
  },
  href : function($, irl, srl) {
    var $o = $("a[href]");
    if(!$o || !$o.length) return;
    for (var i=0,_jref, _att, _dirs, _host, len = $o.length; i < len; ++i) {
      _att = $o[i].attribs;

      if (/{|javascript:/i.test(_att.href)) {
        _jref = rexexc(_att.href, rex);
        if(Array.isArray(_jref)){
          if(_jref[0] === "switchsport"){
            //function SwitchSport(market,sport,isCkecked,IsAutoRefresh){
          }else if(_jref[0] === "showodds"){
            //function ShowOdds(Market, SportType, DispVer) {
          }else if(_jref[0] === "changetotoday"){
          }else if(_jref[0] === "changetolive"){
          }
        }
      }
      if (!/#|mailto:|javascript|signout|logout/.test(_att.href)) {
        _dirs = dirs(irl, _att.href, srl);
        chkHost(_dirs, elemently.hosts, "h");
      }
    }
    caches.sort(1);
    console.log(caches.hwalk, caches.hwalk.length);
  },
  body : function($, uri, srl, options, cb) {
    var $html = $("html"), _uri, _pth, _html, _tmpl = "", _bd, _report = {};
    $html.find("script").each(function(n){
      var $dis = $(this);
      if(strin($dis.html(), "gaJsHost|pageTracker")){
        $dis.remove();
      }
    })
    _html = $html.html();

    if(!_html && _html === "") return null;

    if(elemently.chkswf(_html)){

      //var _loc = "http://" + ("localhost:8666" + uri.path+ "?nest=").replace(/\/\//g, "/") +  uri.protocol + "//" + uri.host;
      //console.log("[31m%s [0m: [31m[1m%s [0m", "√SWF", _loc);
      //chrome({url: _loc});
    }
    //var _host = "bodogjob.com";
    //var _hrex = [RegExp("(https?:\/\/)?(www\.)?(.*)?"+_host, "gi"), "<%=protoc%>//$3<%=host%>"];
    //_html = _html.replace(_hrex[0], _hrex[1])


    if(options.btfy){
      //.replace(/.?\/\/(.*)/g, "/*$1*/")
      _html = regex.rmComments(_html);
      try { _html = beautify.html(regex.rmComments(_html).replace(/  +|\t\t+|\t/g, " ").replace(/\n/g, "") ); $html.html(_html);}
      catch (err) { console.error("BTFY_ERR %s".res, err) }
    }





    _bd = $html.find("body");
    _report.url     =   uri.pathname;
    _report.class   =  _bd.attr("class");
    _report.header  =  _bd.find("#header").html();
    _report.nav     =  _bd.find("#red-nav").html();
    _report.content =  _bd.find("#content-wrapper").html();
    _report.bottom  =  _bd.find("#bottom-wrapper").html();
    _report.footer  =  _bd.find("#footer-wrapper").html();
    _report.form    =  _bd.find("form").parent().html();

    each(_report, function(v,k){
      _tmpl += "\n<!--#" + new Date().getTime()+ "|" +k+ "|" + (""+v).length +" -->\n" + beautify.html(v) + "\n\n";
    })

    _pth = pt.extname(uri.pathname);
    _pth = !_pth || _pth === "" ? trim(uri.pathname,"/") + "/index.html" : trim(uri.pathname,"/");
    _pth = pt.normalize(srl + "/" + uri.host + "/" + _pth);

    fs.mkdirp.w(_pth,_html, function(err){
      fs.mkdirp.w(pt.dirname(_pth) + pt.sep + "tmpl.html",_tmpl, function(err){
        console.log("%s".cyan.bold, _pth);
        cb && cb(err, _report);
      })
    })
  }
}
function intervalRun(nested, intv) {
  function func() {
    if (caches.hwalk.length > 0 && caches.hon !== caches.hwalk[0]) {
      rnum = 0;
      caches.hon = caches.hwalk[0];
      console.log("%s".yellow.bold, caches.hon);

      nested(caches.hon);
    }else{
      rnum++;
      if(rnum >= 40){
        console.log("%s".red.bold, rnum);
        caches.hwalk.length>0 && (caches.hwalk.shift());
        nested("ncr");
        rnum = 0;
      }
    }
  }

  return setInterval(func, intv);
};

var sitemapping = exports.sitemapping = function(url, options, cb){
  options = options || {};
  var _static = options.static || [__dirname, "statics"]
    , _btfy   = options.beautify || true
    , _parts  = options.parts || "form img href script style" //all
    , _map    = {}
    , reqs
  ;//_________________________________

  caches.jar = request.cookier.jar();
  is.arr(_static) && (_static = pt.join(_static[0], _static[1]));
  is.str(_parts)  && (_parts = _parts.split(" "));

  elemently.hosts = options.hosts || [];
  caches.account  = options.account;
  caches.static   = _static;
  caches.proxy    = options.def.proxy;
  caches.h.push(url);
  caches.hwalk.push(url);

  options.cwalks && (caches.h = options.cwalks);
  options.def && (options.def.jar = caches.jar);
  reqs = request.defaults(options.def || { jar : caches.jar});

  function nestedFn(url){
    if(url === "ncr"){
      fs.mkdirp.w([caches.static, "map.txt"], caches.h, function(err){
        console.log("FINE");
        caches.out = true;
        url = "about:blank";
      })
    }

    reqs(url, function(E, R, B){
      if(!R) return console.error("N/A_RES".red);
      if(!B || B.length < 12) return;
      var _uri = R.request.uri, _url = _uri.protocol + "//" + _uri.host + _uri.pathname;
      var $ = domino.load(B);
      for (var i=0, len = _parts.length; i < len; ++i) {
        elemently[_parts[i]]($, _url, _static);
      }
      elemently.body($, _uri, _static, {btfy : true}, function(){
        console.log("[90m%s [0m: [90m[1m%s [0m", "√", fnum++);
        caches.hwalk.length>0 && (caches.hwalk.shift());
      });

    }).on("redirection", reqResend);
  }
  intervalRun(nestedFn, 300);
}


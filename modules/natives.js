(function(root, undefined) {
  require("colors");
  var __g = {};
  var fs = require('./_graceful/fs');
  var pt = require('./_graceful/path');

  var crypto = require('crypto');
  var cmd = require("./_natives/cmd");

  var suction = function (obj, sip, ign, hol, ovr) { ign = ign || []; !Array.isArray(ign) && (ign = [ign]); !Array.isArray(hol) && (hol = [hol]); Object.keys(sip).forEach(function (k) { if (0 > ign.indexOf(k)) { var nk = hol && (0 < hol.indexOf(k) || hol[1] === "*") ? hol[0] + k : k; if (obj.hasOwnProperty(k)) { ovr && (obj[nk] = sip[k]) } else { obj[nk] = sip[k] } } }) };


  suction(__g, require("path"), ["_makeLong"], ["p","join"]);
  suction(__g, require("util"), ["_extend", "inspect"]);
  //suction(__g, require("url"),  [], ["u","*"]);

  __g.uparse    = require("url").parse;
  __g.uformat   = require("url").format;
  __g.uresolve  = require("url").resolve;

  __g.__root = process.cwd();
  __g.gc     = require("./_natives/gc");
  __g.pkg    = require("./pkginfo");

  function pad(str, width) {
      var len = Math.max(0, width - str.length);
      return str + Array(len + 1).join(" ");
  }

  function maxSize(options) {
    return options.reduce(function(max, option) {
        return Math.max(max, option.name.length);
    }, 0);
  };

  var excs = [
    {key:"o", name:"host", def:"0.0.0.0"},
    {key:"p", name:"port", def:"3000"},
    {key:"e", name:"environment", def:"development"},
    {key:"t", name:"type", def:"app"}
  ]
  __g.cmd = function(v, exc) {
    var _cmd = cmd.version(v||'0.0.1');
    if(Object(exc) === exc){
      exc = excs.concat(exc);
      var xl = maxSize(exc) + 1;
      for (i=0,len= exc.length; i < len; ++i) {
        var _exc = exc[i];
        _cmd.option("-" + (_exc.key || _exc.name[0]) + ", --"+ pad(_exc.name, xl) + "<"+_exc.name+">", _exc.name+" ["+ _exc.def + "]", _exc.def);
      }
    }
    return exc ? _cmd.parse(process.argv) : _cmd;
  }

  __g.md5    = function(str, encoding){ return crypto.createHash('md5').update(str).digest(encoding || 'hex'); };
  __g.read   = function(f, cb){ f = __g.normalize(f); try {__f.readFile(f, 'utf8', function (err, doc) { return cb ? cb(null, doc) : null; });} catch(e) {return cb ? cb(err) : null;} }
  __g.vender = function(nm, inc) {
    var _f = __g.resolve(__dirname, "../../vender/" + nm);
    return inc ? fs.readFileSync(_f, "utf-8") : _f;
  }

  module.exports = __g;
}(this));

// require("./edge")




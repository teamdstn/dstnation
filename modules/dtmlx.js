(function(window, undefined) {
  "use strict";

  var fs = require('fs')
    , normalize = require('path').normalize;

  var engines   = {};
  var caches    = {};
  var requires  = {};


  function trim(str,cha)    { return String(str).replace(new RegExp('\^' + cha + '+|' + cha + '+$', 'g'), ''); };
  function isString(obj)    { return Array.prototype.toString.call(obj) == "[object String]"; };
  function underscored(str){
    return $g.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
  };
  function each(o, i) { Object.keys(o).forEach(function (k) { i(o[k], k, o); }); }
  function read(f, options, fn) {
    var _str = caches[f];
    if (options.cache && _str) return fn(null, _str);
    fs.readFile(f, 'utf8', function (err, doc) {
      if (err) return fn(err);
      options.cache && (caches[f] = doc);
      fn(null, doc);
    });
  }

  function buildDef(a, b) {
    return each(a, function(v,k){
      if( isArray(v)){ b[k] = v.join(' '); }
      else{ b[k] = "<%# def."+ underscored(v)+" %>";}
    })
  }

  var dtml = function dtml(options) {
      var engine = requires.dtml || (requires["dtml"] = require("./_engines/dtml.js"));
      options = options || {};
      options.caches && (caches = options.caches);
      options.func && (engine.func = isString(options.func) ? require(options.func) : options.func);
      if (options.pred) {
        options.cache = false;
        caches.pred = "";
        for (var i = 0, len = options.pred.length; i < len; i++) {
          read(normalize(options.path ? options.path + "/" + options.pred[i] : options.pred[i]), options, function (err, doc) {
            if (!err) {
              var ___def = caches.def = caches.def || {};
              engine.defines(doc, ___def);
            }
          });
        }
      }
      return function dtml(f, options, next) {
        var __def = caches.def;
        __def.submenu = __def.contents = __def.sidemenu = "";
        options = options || {
          cache: true,
          def: {}
        };
        read(f, options, function (err, doc) {
          if (err) return next(err);
          try {
            options.filename = f;
            if (options.frame) {} else {
              console.log(options);
              var _page = underscored(options.expose.page);
              __def.contents = "<%# def." + _page + " %>";
              var spl = __def[_page].split("[^gdata]");
              if (spl.length === 3) {
                var gdata = JSON.parse(spl.slice(1, spl.length - 1)[0]);
                gdata.defs && buildDef(gdata.defs, __def);
                gdata.cls && (options.expose.cls = gdata.cls);
              }
            }
            options.glob = options.glob || {};
            options.expose.lang = options.expose.lang || "en";
            var tmpl = engine.compile(doc, __def);
            next(null, tmpl(options));
          } catch (err) {
            console.log(err);
            next(err);
          }
        });
      };
    };
  engines.dtml = dtml;
  var __instance = engines,
    __name = "engines",
    __nms = "$g";
  var freeExports = "object" == typeof exports && exports && ("object" == typeof global && global && global == global.global && (window = global), exports);
  "function" == typeof define && "object" == typeof define.amd && define.amd ? (window[__name] = __instance, define(function () {
    return __instance;
  })) : freeExports ? "object" == typeof module && module && module.exports == freeExports ? (module.exports = __instance)[__name] = __instance : freeExports[__name] = __instance : (window[__nms] = window[__nms] || {}, window[__nms][__name] = __instance);
})(this);

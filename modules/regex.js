(function() {
  var root = this;
  var __Array=Array.prototype, __String=String.prototype, __Object=Object.prototype ,keys=Object.keys, toString=__Object.toString ,hasOwnProperty=__Object.hasOwnProperty
    , is = {"arr": __Array.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
    , each = function(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }
    , __e ="object" == typeof exports && exports && ("object"==typeof global && global && global === global.global && (root=global), exports)
    , __i, __nm, __nms, __o
  ;//_________________________________
  each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; })
  ;//__________________________________

  /*!
   * Copyright(c) 2010 TeamDstn Inc.
   * Copyright(c) 2012 TeamDstn.Dustin
   * MIT Licensed
   */

  var regex = {};
  regex.rmComments = function(str) {
    var uid = '_' + +new Date(),
        primatives = [],
        primIndex = 0;
    return (
      str
      //.replace(/<!--[\s\S]*?-->|/g, '')
      .replace(/(['"])(\\\1|.)+?\1/g, function(match){
        primatives[primIndex] = match;
        return (uid + '') + primIndex++;
      })
      .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function(match, $1, $2){
        primatives[primIndex] = $2;
        return $1 + (uid + '') + primIndex++;
      })
      .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')
      .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')
      .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')
      .replace(RegExp(uid + '(\\d+)', 'g'), function(match, n){
        return primatives[n];
      })
    );
  }


  //[exports] :________________________
  __i = regex, __nm = "regex", __nms = "edge", __o = root[__nms];
  "function"==typeof define && "object"==typeof define.amd && define.amd ? (root[__nm]=__i,define(function(){return __i})):__e?"object"==typeof module&&module&&module.exports === __e ? (module.exports=__i)[__nm]=__i : __e[__nm] = __i
  :(root[__nms]=root[__nms]||{},root[__nms][__nm]=__i);
  //:root[__nm] = __i
  ;//__________________________________
}).call(this);

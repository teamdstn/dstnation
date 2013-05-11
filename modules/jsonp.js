//function (exports, require, module, __filename, __dirname) { (function(root, undefined) {
(function(root, undefined) {
  //'use strict';

  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }
    , __hasProp = {}.hasOwnProperty
    , __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }
  ;
  var toString = Object.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var isArray  = function(obj) { return toString.call(obj) === "[object Array]";  };
  var isObject = function(obj) { return toString.call(obj) === "[object Object]"; };
  var isString = function(obj) { return toString.call(obj) === "[object String]"; };

  var eq=function(a, b, e, h){if(a===b)return 0!==a||1/a==1/b;if(null==a||null==b)return a===b;a instanceof __g&&(a=a._wrapped);b instanceof __g&&(b=b._wrapped);var d=toString.call(a);if(d!=toString.call(b))return!1;switch(d){case "[object String]":return a==String(b);case "[object Number]":return a!=+a?b!=+b:0==a?1/a==1/b:a==+b;case "[object Date]":case "[object Boolean]":return+a==+b;case "[object RegExp]":return a.source==b.source&&a.global==b.global&&a.multiline==b.multiline&&a.ignoreCase==b.ignoreCase}if("object"!=
  typeof a||"object"!=typeof b)return!1;for(var c=e.length;c--;)if(e[c]==a)return h[c]==b;e.push(a);h.push(b);var c=0,f=!0;if("[object Array]"==d){if(c=a.length,f=c==b.length)for(;c--&&(f=eq(a[c],b[c],e,h)););}else{var d=a.constructor,i=b.constructor;if(d!==i&&(!__g.isFunction(d)||!(d instanceof d&&__g.isFunction(i)&&i instanceof i)))return!1;for(var g in a)if(__g.has(a,g)&&(c++,!(f=__g.has(b,g)&&eq(a[g],b[g],e,h))))break;if(f){for(g in b)if(__g.has(b,g)&&!c--)break;f=!c}}e.pop();h.pop();return f};
  var isEqual=function(a,b){return eq(a,b,[],[])};
  var __j = { };

/* "" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  var JSONPatchError      = function(_super){function fnErr(fnErr){this.name="JSONPatchError";    this.message=fnErr||"JSON patch error"} __extends(fnErr,_super);return fnErr}(Error)
    , InvalidPatchError   = function(_super){function fnErr(fnErr){this.name="InvalidPatch";      this.message=fnErr||"Invalid patch"   } __extends(fnErr,_super);return fnErr}(JSONPatchError)
    , PatchConflictError  = function(_super){function fnErr(fnErr){this.name="PatchConflictError";this.message=fnErr||"Patch conflict"  } __extends(fnErr,_super);return fnErr}(JSONPatchError)
  ;

/* "" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  var ___v = "value"
    , ___t = "to"
    , ___n = null
  ;
  var JSONPatch, JSONPointer, add, apply, compile, memberProcessors, methodMap, move, operationMembers, remove, replace, test;

  JSONPointer = function() {
    function JSONPointer(path, shouldExist) {
      var i, loc, steps, _i, _len;
      if (shouldExist == null) {
        shouldExist = true;
      }
      if (path && (steps = path.split("/")).shift() !== "") {
        throw new InvalidPatchError();
      }
      for (i = _i = 0, _len = steps.length; _i < _len; i = ++_i) {
        loc = steps[i];
        steps[i] = decodeURIComponent(loc);
      }
      this.accessor = steps.pop();
      this.path = steps;
    }

    JSONPointer.prototype.getObject = function(obj) {
      var loc, _i, _len, _ref;
      _ref = this.path;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        loc = _ref[_i];
        if (isArray(obj)) {
          loc = parseInt(loc, 10);
        }
        if (!hasOwnProperty.call(obj, loc)) {
          throw new PatchConflictError("Array location out of bounds or not an instance property");
        }
        obj = obj[loc];
      }
      return obj;
    };
    return JSONPointer;

  }();

  JSONPatch = function() {
    function JSONPatch(patch) {
      var key, member, method, preproc, supp;
      for (key in patch) {
        if (!(method = methodMap[key])) {
          continue;
        }
        if (this.operation) {
          throw new InvalidPatchError();
        }
        if ((member = operationMembers[key]) && patch[member] === void 0) {
          throw new InvalidPatchError("Patch member " + member + " not defined");
        }
        this.operation = methodMap[key];
        this.pointer = new JSONPointer(patch[key]);
        supp = patch[member];
        if (preproc = memberProcessors[key]) {
          supp = preproc(supp);
        }
        this.supplement = supp;
      }
      if (!this.operation) {
        throw new InvalidPatchError();
      }
    }

    JSONPatch.prototype.apply = function(obj) {
      return this.operation(obj, this.pointer, this.supplement);
    };
    return JSONPatch;
  }();

  add = function(root, pointer, value) {
    var acc, obj;
    obj = pointer.getObject(root);
    acc = pointer.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
      if (acc < 0 || acc > obj.length) {
        throw new PatchConflictError("Index " + acc + " out of bounds");
      }
      obj.splice(acc, 0, value);
    } else {
      if (hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " exists");
      }
      obj[acc] = value;
    }
  };

  remove = function(root, pointer) {
    var acc, obj;
    obj = pointer.getObject(root);
    acc = pointer.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      obj.splice(acc, 1);
    } else {
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      delete obj[acc];
    }
  };

  replace = function(root, pointer, value) {
    var acc, obj;
    obj = pointer.getObject(root);
    acc = pointer.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      obj.splice(acc, 1, value);
    } else {
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      obj[acc] = value;
    }
  };

  test = function(root, pointer, value) {
    var acc, obj;
    obj = pointer.getObject(root);
    acc = pointer.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
    }
    return isEqual(obj[acc], value);
  };

  move = function(root, from, to) {
    var acc, obj, value;
    obj = from.getObject(root);
    acc = from.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      value = obj.splice(acc, 1)[0];
    } else {
      if (!hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " does not exist");
      }
      value = obj[acc];
      delete obj[acc];
    }
    obj = to.getObject(root);
    acc = to.accessor;
    if (isArray(obj)) {
      acc = parseInt(acc, 10);
      if (acc < 0 || acc > obj.length) {
        throw new PatchConflictError("Index " + acc + " out of bounds");
      }
      obj.splice(acc, 0, value);
    } else {
      if (hasOwnProperty.call(obj, acc)) {
        throw new PatchConflictError("Value at " + acc + " exists");
      }
      obj[acc] = value;
    }
  };

  methodMap = {
    add     : add,
    remove  : remove,
    replace : replace,
    test    : test,
    move    : move
  };

  operationMembers = {
    add     : ___v,
    remove  : ___n,
    replace : ___v,
    test    : ___v,
    move    : ___t
  };

  memberProcessors = {
    move: function(to) {
      return new JSONPointer(to);
    }
  };

  apply = function(root, patchDocument) {
    return compile(patchDocument)(root);
  };

  compile = function(patchDocument) {
    var operations, patch, _i, _len;
    operations = [];
    for (_i = 0, _len = patchDocument.length; _i < _len; _i++) {
      patch = patchDocument[_i];
      operations.push(new JSONPatch(patch));
    }
    return function(root) {
      var op, result, _j, _len1;
      for (_j = 0, _len1 = operations.length; _j < _len1; _j++) {
        op = operations[_j];
        result = op.apply(root);
      }
      return result;
    };
  };




/* "alias" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  __j.apply               = apply;
  __j.compile             = compile;
  __j.JSONPatchError      = JSONPatchError;
  __j.InvalidPatchError   = InvalidPatchError;
  __j.PatchConflictError  = PatchConflictError;

  /*
  __j.exports = function() {
    var result = {};
    for (var prop in this) {
      if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
      result[prop] = this[prop];
    }
    return result;
  };
  */
  var __instance = __j, __name = "$j", __nms = "__g";
  __instance.noConflict = function() { root[__nms] = __precedent; return this; };
  var __e ="object"==typeof exports && exports && ("object"==typeof global && global && global === global.global && (root=global), exports);
  //if(__e){ __g.suction(__g, require("./natives"));}
  //else{ root.require=function(){} }

  "function"==typeof define&&"object"==typeof define.amd&&define.amd?(root[__name]=__instance,define(function(){return __instance})):__e?"object"==typeof module&&module&&module.exports === __e ? (module.exports=__instance)[__name]=__instance : __e[__name] = __instance
  :(root[__nms]=root[__nms]||{},root[__nms][__name]=__instance);
  //:root[__name] = __instance;  //mainmodule

}(this));



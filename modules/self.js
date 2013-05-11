var Proto = function () {
    "use strict";
    var makeClass, objectCreate;

    function Proto() {
      return Proto.extend.apply(Proto, arguments);
    }
    if (typeof Object.create === "function") {
      objectCreate = Object.create;
    } else {
      objectCreate = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
      };
    }

    function wrapMethodWithProto(fn) {
      return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(this);
        return fn.apply(this, args);
      };
    }

    function makeExtendMethod(Class) {
      return function (def) {
        return makeClass(Class, def);
      };
    }

    function makeMixinMethod(Class) {
      return function (Mixin) {
        var key;
        for (key in Mixin) {
          if (Mixin.hasOwnProperty(key) && key !== "prototype" && key !== "__super__" && key !== "extend" && key !== "mixin" && key !== "staticProps") {
            Class[key] = Mixin[key];
          }
        }
        for (key in Mixin.prototype) {
          if (typeof Class.prototype[key] === "undefined" && !Object.hasOwnProperty(key)) {
            Class.prototype[key] = Mixin.prototype[key];
          }
        }
        return Class;
      };
    }

    function makeStaticPropsMethod(Class) {
      return function (def) {
        var key;
        def = def || {};
        for (key in def) {
          if (def.hasOwnProperty(key)) {
            Class[key] = def[key];
          }
        }
        return Class;
      };
    }
    makeClass = function (Parent, def) {
      var key;

      function Class() {
        var obj;
        if (this && this.__class__) {
          Class.prototype.constructor.apply(this, arguments);
          return this;
        }
        if (this instanceof Class) {
          obj = this;
        } else {
          obj = objectCreate(Class.prototype);
        }
        obj.__class__ = Class;
        obj.__super__ = Parent.prototype;
        if (typeof obj.constructor === "function") {
          obj.constructor.apply(obj, arguments);
        }
        return obj;
      }
      for (key in Parent) {
        if (Parent.hasOwnProperty(key) && Parent[key] !== Proto[key]) {
          Class[key] = Parent[key];
        }
      }
      Class.prototype = objectCreate(Parent.prototype);
      Class.__super__ = Parent.prototype;
      Class.extend = makeExtendMethod(Class);
      Class.mixin = makeMixinMethod(Class);
      Class.staticProps = makeStaticPropsMethod(Class);
      for (key in def) {
        if (!Object.hasOwnProperty(key)) {
          if (typeof def[key] === "function") {
            Class.prototype[key] = wrapMethodWithProto(def[key]);
          } else {
            Class.prototype[key] = def[key];
          }
        }
      }
      return Class;
    };
    Proto.__super__ = Object.prototype;
    Proto.extend = function (arg1, arg2) {
      if (typeof arg2 === "undefined") {
        return makeClass(Proto, arg1);
      }
      return makeClass(Proto.create(arg1), arg2);
    };
    Proto.mixin = makeMixinMethod(Proto);
    Proto.create = function (Proto) {
      var key;

      function Class() {
        var obj;
        if (this instanceof Class || this && this.__class__) {
          obj = this;
        } else {
          obj = objectCreate(Class.prototype);
        }
        Proto.apply(obj, arguments);
        return obj;
      }
      for (key in Proto) {
        if (Proto.hasOwnProperty(key)) {
          Class[key] = Proto[key];
        }
      }
      Class.__super__ = Object.prototype;
      Class.extend = makeExtendMethod(Class);
      Class.mixin = makeMixinMethod(Class);
      Class.staticProps = makeStaticPropsMethod(Class);
      Class.prototype = objectCreate(Proto.prototype);
      return Class;
    };
    return Proto;
  }();

if (typeof module !== "undefined") {
  module.exports = Proto;
}

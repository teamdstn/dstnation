(function() {
  function n(n) {
    if (n) {
      __g.mixin(require("./mx.strings"));
      __g.until = function n(t, r, e) {
        if (t()) return e();
        r(function(i) {
          if (i) return e(i);
          n(t, r, e);
          return void 0;
        });
        return void 0;
      };
      __g.serial = function(n, t) {
        function r(n, t) {
          n.length ? n.shift()(function(i, u) {
            i ? t(i, e) : (e.push(u), r(n, t));
          }) : t(null, e);
        }
        var n = n.slice(0), e = [];
        r(n, t);
      };
      __g.parallel = function(n, t) {
        var r = "object" == typeof n ? Object.keys(n).length : n.length, e = {}, i = !1, u = {};
        r || t(null, u);
        for (var a in n) (function() {
          var o = n[a], c = a;
          pprocess.nextTick(function() {
            o(function(n, a) {
              n && (e[c] = n, i = !0);
              a && (u[c] = a);
              r--;
              0 == r && t(i ? e : null, u);
            });
          });
        })();
      };
      __g.serials = function(n, t, r) {
        if (!n.length) return r();
        var e = 0, i = function() {
          t(n[e], function(t) {
            if (t) {
              r(t);
              r = function() {};
            } else {
              e++;
              e == n.length ? r() : i();
            }
          });
        };
        i();
      };
      __g.arg = function(n, t) {
        !t && (t = 0);
        for (var r = t, e = (n || []).length, i = Array(e - t); e > r; r++) i[r - t] = n[r];
        return i;
      };
      __g.args = function(n, t) {
        var r, e = __g.arg(n);
        t && !e[0] ? e.shift() : E(e, "first", {
          value: e[0]
        });
        r = e[e.length - 1] || e[e.length];
        "function" == typeof r && (E(e, "callback", {
          value: r
        }), E(e, "next", {
          value: r
        }), E(e, "cb", {
          value: r
        }), e.pop());
        e.length && E(e, "last", {
          value: e[e.length - 1]
        });
        return e;
      };
      __g.merging = function(obj, n, t, r) {
        if (!obj || !n) return null;
        r = r || [];
        var e, obj = t ? __g.clone(obj) : obj;
        for (e in n) !__g.include(r, e) && (obj[e] = n[e]);
        return obj;
      };
      __g.uuid = function() {
        for (var n = [], t = 0; 36 > t; t++) n[t] = Math.floor(16 * Math.random());
        n[14] = 4;
        n[19] = n[19] & 3 | 8;
        for (t = 0; 36 > t; t++) n[t] = "0123456789ABCDEF";
        [ n[t] ];
        n[8] = n[13] = n[18] = n[23] = "-";
        return n.join("");
      };
      __g.suction = function(obj, n, t, r, e) {
        t = t || [];
        !Array.isArray(t) && (t = [ t ]);
        !Array.isArray(r) && (r = [ r ]);
        Object.keys(n).forEach(function(i) {
          if (0 > t.indexOf(i)) {
            var u = r && (r.indexOf(i) > 0 || r[1] === "*") ? r[0] + i : i;
            obj.hasOwnProperty(i) ? e && (obj[u] = n[i]) : obj[u] = n[i];
          }
        });
      };
    }
    __g.mixin(__g);
    _([ "pop", "push", "reverse", "shift", "sort", "splice", "unshift" ], function(n) {
      var t = o[n];
      __g.prototype[n] = function() {
        var obj = this._wrapped;
        t.apply(obj, arguments);
        n != "shift" && n != "splice" || obj.length !== 0 || delete obj[0];
        return D.call(this, obj);
      };
    });
    _([ "concat", "join", "slice" ], function(n) {
      var t = o[n];
      __g.prototype[n] = function() {
        return D.call(this, t.apply(this._wrapped, arguments));
      };
    });
    __g.extend(__g.prototype, {
      chain: function() {
        this._chain = !0;
        return this;
      },
      value: function() {
        return this._wrapped;
      }
    });
    if (!n) return {};
    __g.suction(__g, require("../modules/natives"));
    module.paths.unshift(__g.resolve(__dirname, "../modules"));
    __g.mixin(require("_engines/dtml"));
    __g.module = function(n) {
      return require(n);
    };
    __g.modules = function(n, t) {
      var r = {};
      __g.each(n.split(" "), function(n) {
        this[n] = __g.module(n);
      }, r);
      return t ? __g.gc(r) : r;
    };
    __g.patches = function(n) {
      var t = require("patches");
      __g.each(n, function(n, r) {
        t.hasOwnProperty(r) && t[r](n);
      }, n);
      return n;
    };
    __g.gd = function(n) {
      n = n || 0;
      if (n === "native") return __g.merging(new __g(), require("../pac/native"), !0, [ "graceful" ]);
      if (n === 0) {
        var t = __g.merging(this, require("../pac/all"), !0, [ "graceful" ]), r = __g.gc(t);
        delete r.edge;
        return r;
      }
    };
  }
  var t, r, e, i, u, a = this, o = Array.prototype, c = String.prototype, l = Object.prototype, f = Function.prototype, s = o.forEach, p = o.map, h = o.reduce, v = o.reduceRight, g = o.filter, d = o.every, m = o.some, y = o.indexOf, b = o.lastIndexOf, x = f.bind, y = (c.trim, 
  c.trimLeft, c.trimRight, o.indexOf), b = o.lastIndexOf, j = o.push, w = o.slice, O = o.concat, A = (o.unshift, 
  l.toString), k = l.hasOwnProperty, E = Object.defineProperty, q = Object.keys, F = [].isArray, x = f.bind, R = {}, __g = function(obj) {
    if (obj instanceof __g) return obj;
    if (!(this instanceof __g)) return new __g(obj);
    this._wrapped = obj;
    return this;
  }, _ = __g.each = __g.forEach = function(obj, n, t) {
    if (s && obj.forEach === s) obj.forEach(n, t); else if (obj.length === +obj.length) {
      for (var r = 0, e = obj.length; e > r; r++) if (n.call(t, obj[r], r, obj) === R) return;
    } else for (var i in obj) if (__g.has(obj, i) && n.call(t, obj[i], i, obj) === R) return;
  };
  __g.map = __g.collect = function(obj, n, t) {
    var r = [];
    if (p && obj.map === p) return obj.map(n, t);
    _(obj, function(e, i, u) {
      r[r.length] = n.call(t, e, i, u);
    });
    return r;
  };
  __g.reduce = __g.foldl = __g.inject = function(obj, n, t, r) {
    var e = arguments.length > 2;
    if (h && obj.reduce === h) {
      r && (n = __g.bind(n, r));
      return e ? obj.reduce(n, t) : obj.reduce(n);
    }
    _(obj, function(i, u, a) {
      if (e) t = n.call(r, t, i, u, a); else {
        t = i;
        e = !0;
      }
    });
    if (!e) throw new TypeError("Reduce of empty array with no initial value");
    return t;
  };
  __g.reduceRight = __g.foldr = function(obj, n, t, r) {
    var e = arguments.length > 2;
    if (v && obj.reduceRight === v) {
      r && (n = __g.bind(n, r));
      return arguments.length > 2 ? obj.reduceRight(n, t) : obj.reduceRight(n);
    }
    var i = obj.length;
    if (i !== +i) {
      var u = __g.keys(obj);
      i = u.length;
    }
    _(obj, function(a, o, c) {
      o = u ? u[--i] : --i;
      if (e) t = n.call(r, t, obj[o], o, c); else {
        t = obj[o];
        e = !0;
      }
    });
    if (!e) throw new TypeError("Reduce of empty array with no initial value");
    return t;
  };
  __g.find = __g.detect = function(obj, n, t) {
    var r;
    M(obj, function(e, i, u) {
      if (n.call(t, e, i, u)) {
        r = e;
        return !0;
      }
    });
    return r;
  };
  __g.filter = __g.select = function(obj, n, t) {
    var r = [];
    if (g && obj.filter === g) return obj.filter(n, t);
    _(obj, function(e, i, u) {
      n.call(t, e, i, u) && (r[r.length] = e);
    });
    return r;
  };
  __g.reject = function(obj, n, t) {
    var r = [];
    _(obj, function(e, i, u) {
      n.call(t, e, i, u) || (r[r.length] = e);
    });
    return r;
  };
  __g.every = __g.all = function(obj, n, t) {
    n || (n = __g.identity);
    var r = !0;
    if (d && obj.every === d) return obj.every(n, t);
    _(obj, function(e, i, u) {
      return (r = r && n.call(t, e, i, u)) ? void 0 : R;
    });
    return !!r;
  };
  var M = __g.some = __g.any = function(obj, n, t) {
    n || (n = __g.identity);
    var r = !1;
    if (m && obj.some === m) return obj.some(n, t);
    _(obj, function(e, i, u) {
      return r || (r = n.call(t, e, i, u)) ? R : void 0;
    });
    return !!r;
  };
  __g.contains = __g.include = function(obj, n) {
    var t = !1;
    if (y && obj.indexOf === y) return obj.indexOf(n) != -1;
    t = M(obj, function(t) {
      return t === n;
    });
    return t;
  };
  __g.invoke = function(obj, n) {
    var t = w.call(arguments, 2);
    return __g.map(obj, function(r) {
      return (__g.isFunction(n) ? n : r[n]).apply(r, t);
    });
  };
  __g.pluck = function(obj, n) {
    return __g.map(obj, function(t) {
      return t[n];
    });
  };
  __g.where = function(obj, n) {
    return __g.isEmpty(n) ? [] : __g.filter(obj, function(t) {
      for (var r in n) if (n[r] !== t[r]) return !1;
      return !0;
    });
  };
  __g.max = function(obj, n, t) {
    if (!n && __g.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.max.apply(Math, obj);
    if (!n && __g.isEmpty(obj)) return -1/0;
    var r = {
      computed: -1/0
    };
    _(obj, function(e, i, u) {
      var a = n ? n.call(t, e, i, u) : e;
      a >= r.computed && (r = {
        value: e,
        computed: a
      });
    });
    return r.value;
  };
  __g.min = function(obj, n, t) {
    if (!n && __g.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.min.apply(Math, obj);
    if (!n && __g.isEmpty(obj)) return 1/0;
    var r = {
      computed: 1/0
    };
    _(obj, function(e, i, u) {
      var a = n ? n.call(t, e, i, u) : e;
      r.computed > a && (r = {
        value: e,
        computed: a
      });
    });
    return r.value;
  };
  __g.shuffle = function(obj) {
    var n, t = 0, r = [];
    _(obj, function(e) {
      n = __g.random(t++);
      r[t - 1] = r[n];
      r[n] = e;
    });
    return r;
  };
  var I = function(n) {
    return __g.isFunction(n) ? n : function(obj) {
      return obj[n];
    };
  };
  __g.sortBy = function(obj, n, t) {
    var r = I(n);
    return __g.pluck(__g.map(obj, function(n, e, i) {
      return {
        value: n,
        index: e,
        criteria: r.call(t, n, e, i)
      };
    }).sort(function(n, t) {
      var r = n.criteria, e = t.criteria;
      if (r !== e) {
        if (r > e || r === void 0) return 1;
        if (e > r || e === void 0) return -1;
      }
      return t.index > n.index ? -1 : 1;
    }), "value");
  };
  var T = function(obj, n, t, r) {
    var e = {}, i = I(n);
    _(obj, function(n, u) {
      var a = i.call(t, n, u, obj);
      r(e, a, n);
    });
    return e;
  };
  __g.groupBy = function(obj, n, t) {
    return T(obj, n, t, function(n, t, r) {
      (__g.has(n, t) ? n[t] : n[t] = []).push(r);
    });
  };
  __g.countBy = function(obj, n, t) {
    return T(obj, n, t, function(n, t) {
      __g.has(n, t) || (n[t] = 0);
      n[t]++;
    });
  };
  __g.sortedIndex = function(n, obj, t, r) {
    t = t == null ? __g.identity : I(t);
    var e = t.call(r, obj), i = 0, u = n.length;
    while (u > i) {
      var a = i + u >>> 1;
      e > t.call(r, n[a]) ? i = a + 1 : u = a;
    }
    return i;
  };
  __g.toArray = function(obj) {
    return obj ? obj.length === +obj.length ? w.call(obj) : __g.values(obj) : [];
  };
  __g.size = function(obj) {
    return obj.length === +obj.length ? obj.length : __g.keys(obj).length;
  };
  __g.first = __g.head = __g.take = function(n, t, r) {
    return t == null || r ? n[0] : w.call(n, 0, t);
  };
  __g.initial = function(n, t, r) {
    return w.call(n, 0, n.length - (t == null || r ? 1 : t));
  };
  __g.last = function(n, t, r) {
    return t == null || r ? n[n.length - 1] : w.call(n, Math.max(n.length - t, 0));
  };
  __g.rest = __g.tail = __g.drop = function(n, t, r) {
    return w.call(n, t == null || r ? 1 : t);
  };
  __g.compact = function(n) {
    return __g.filter(n, function(n) {
      return !!n;
    });
  };
  var B = function(n, t, r) {
    _(n, function(n) {
      __g.isArray(n) ? t ? j.apply(r, n) : B(n, t, r) : r.push(n);
    });
    return r;
  };
  __g.flatten = function(n, t) {
    return B(n, t, []);
  };
  __g.without = function(n) {
    return __g.difference(n, w.call(arguments, 1));
  };
  __g.uniq = __g.unique = function(n, t, r, e) {
    var i = r ? __g.map(n, r, e) : n, u = [], a = [];
    _(i, function(r, e) {
      if (t ? !e || a[a.length - 1] !== r : !__g.contains(a, r)) {
        a.push(r);
        u.push(n[e]);
      }
    });
    return u;
  };
  __g.union = function() {
    return __g.uniq(O.apply(o, arguments));
  };
  __g.intersection = function(n) {
    var t = w.call(arguments, 1);
    return __g.filter(__g.uniq(n), function(n) {
      return __g.every(t, function(t) {
        return __g.indexOf(t, n) >= 0;
      });
    });
  };
  __g.difference = function(n) {
    var t = O.apply(o, w.call(arguments, 1));
    return __g.filter(n, function(n) {
      return !__g.contains(t, n);
    });
  };
  __g.zip = function() {
    for (var n = w.call(arguments), t = __g.max(__g.pluck(n, "length")), r = Array(t), e = 0; t > e; e++) r[e] = __g.pluck(n, "" + e);
    return r;
  };
  __g.object = function(n, t) {
    for (var r = {}, e = 0, i = n.length; i > e; e++) t ? r[n[e]] = t[e] : r[n[e][0]] = n[e][1];
    return r;
  };
  __g.indexOf = function(n, t, r) {
    var e = 0, i = n.length;
    if (r) {
      if (typeof r != "number") {
        e = __g.sortedIndex(n, t);
        return n[e] === t ? e : -1;
      }
      e = 0 > r ? Math.max(0, i + r) : r;
    }
    if (y && n.indexOf === y) return n.indexOf(t, r);
    for (;i > e; e++) if (n[e] === t) return e;
    return -1;
  };
  __g.lastIndexOf = function(n, t, r) {
    var e = r != null;
    if (b && n.lastIndexOf === b) return e ? n.lastIndexOf(t, r) : n.lastIndexOf(t);
    var i = e ? r : n.length;
    while (i--) if (n[i] === t) return i;
    return -1;
  };
  __g.range = function(n, t, r) {
    if (1 >= arguments.length) {
      t = n || 0;
      n = 0;
    }
    r = arguments[2] || 1;
    var e = Math.max(Math.ceil((t - n) / r), 0), i = 0, u = Array(e);
    while (e > i) {
      u[i++] = n;
      n += r;
    }
    return u;
  };
  var N = function() {};
  __g.bind = function(n, t) {
    var r, e;
    if (n.bind === x && x) return x.apply(n, w.call(arguments, 1));
    if (!__g.isFunction(n)) throw new TypeError();
    e = w.call(arguments, 2);
    return r = function() {
      if (!(this instanceof r)) return n.apply(t, e.concat(w.call(arguments)));
      N.prototype = n.prototype;
      var i = new N(), u = n.apply(i, e.concat(w.call(arguments)));
      return Object(u) === u ? u : i;
    };
  };
  __g.bindAll = function(obj) {
    var n = w.call(arguments, 1);
    n.length == 0 && (n = __g.functions(obj));
    _(n, function(n) {
      obj[n] = __g.bind(obj[n], obj);
    });
    return obj;
  };
  __g.memoize = function(n, t) {
    var r = {};
    t || (t = __g.identity);
    return function() {
      var e = t.apply(this, arguments);
      return __g.has(r, e) ? r[e] : r[e] = n.apply(this, arguments);
    };
  };
  __g.delay = function(n, t) {
    var r = w.call(arguments, 2);
    return setTimeout(function() {
      return n.apply(null, r);
    }, t);
  };
  __g.defer = function(n) {
    return __g.delay.apply(__g, [ n, 1 ].concat(w.call(arguments, 1)));
  };
  __g.throttle = function(n, t) {
    var r, e, i, u, a, o, c = __g.debounce(function() {
      a = u = !1;
    }, t);
    return function() {
      r = this;
      e = arguments;
      var l = function() {
        i = null;
        a && (o = n.apply(r, e));
        c();
      };
      i || (i = setTimeout(l, t));
      if (u) a = !0; else {
        u = !0;
        o = n.apply(r, e);
      }
      c();
      return o;
    };
  };
  __g.debounce = function(n, t, r) {
    var e, i;
    return function() {
      var u = this, a = arguments, o = function() {
        e = null;
        r || (i = n.apply(u, a));
      }, c = r && !e;
      clearTimeout(e);
      e = setTimeout(o, t);
      c && (i = n.apply(u, a));
      return i;
    };
  };
  __g.once = function(n) {
    var t, r = !1;
    return function() {
      if (r) return t;
      r = !0;
      t = n.apply(this, arguments);
      n = null;
      return t;
    };
  };
  __g.wrap = function(n, t) {
    return function() {
      var r = [ n ];
      j.apply(r, arguments);
      return t.apply(this, r);
    };
  };
  __g.compose = function() {
    var n = arguments;
    return function() {
      for (var t = arguments, r = n.length - 1; r >= 0; r--) t = [ n[r].apply(this, t) ];
      return t[0];
    };
  };
  __g.after = function(n, t) {
    return n > 0 ? function() {
      return 1 > --n ? t.apply(this, arguments) : void 0;
    } : t();
  };
  __g.keys = q || function(obj) {
    if (obj !== Object(obj)) throw new TypeError("Invalid object");
    var n = [];
    for (var t in obj) __g.has(obj, t) && (n[n.length] = t);
    return n;
  };
  __g.values = function(obj) {
    var n = [];
    for (var t in obj) __g.has(obj, t) && n.push(obj[t]);
    return n;
  };
  __g.pairs = function(obj) {
    var n = [];
    for (var t in obj) __g.has(obj, t) && n.push([ t, obj[t] ]);
    return n;
  };
  __g.invert = function(obj) {
    var n = {};
    for (var t in obj) __g.has(obj, t) && (n[obj[t]] = t);
    return n;
  };
  __g.functions = __g.methods = function(obj) {
    var n = [];
    for (var t in obj) __g.isFunction(obj[t]) && n.push(t);
    return n.sort();
  };
  __g.extend = function(obj) {
    _(w.call(arguments, 1), function(n) {
      for (var t in n) obj[t] = n[t];
    });
    return obj;
  };
  __g.pick = function(obj) {
    var n = {}, t = O.apply(o, w.call(arguments, 1));
    _(t, function(t) {
      t in obj && (n[t] = obj[t]);
    });
    return n;
  };
  __g.omit = function(obj) {
    var n = {}, t = O.apply(o, w.call(arguments, 1));
    for (var r in obj) __g.contains(t, r) || (n[r] = obj[r]);
    return n;
  };
  __g.defaults = function(obj) {
    _(w.call(arguments, 1), function(n) {
      for (var t in n) obj[t] == null && (obj[t] = n[t]);
    });
    return obj;
  };
  __g.clone = function(obj) {
    return __g.isObject(obj) ? __g.isArray(obj) ? obj.slice() : __g.extend({}, obj) : obj;
  };
  __g.tap = function(obj, n) {
    n(obj);
    return obj;
  };
  var S = function(n, t, r, e) {
    if (n === t) return n !== 0 || 1 / n == 1 / t;
    if (n == null || t == null) return n === t;
    n instanceof __g && (n = n._wrapped);
    t instanceof __g && (t = t._wrapped);
    var i = A.call(n);
    if (i != A.call(t)) return !1;
    switch (i) {
     case "[object String]":
      return n == t + "";

     case "[object Number]":
      return n != +n ? t != +t : n == 0 ? 1 / n == 1 / t : n == +t;

     case "[object Date]":
     case "[object Boolean]":
      return +n == +t;

     case "[object RegExp]":
      return n.source == t.source && n.global == t.global && n.multiline == t.multiline && n.ignoreCase == t.ignoreCase;
    }
    if (typeof n != "object" || typeof t != "object") return !1;
    var u = r.length;
    while (u--) if (r[u] == n) return e[u] == t;
    r.push(n);
    e.push(t);
    var a = 0, o = !0;
    if (i == "[object Array]") {
      a = n.length;
      o = a == t.length;
      if (o) while (a--) if (!(o = S(n[a], t[a], r, e))) break;
    } else {
      var c = n.constructor, l = t.constructor;
      if (c !== l && !(__g.isFunction(c) && c instanceof c && __g.isFunction(l) && l instanceof l)) return !1;
      for (var f in n) if (__g.has(n, f)) {
        a++;
        if (!(o = __g.has(t, f) && S(n[f], t[f], r, e))) break;
      }
      if (o) {
        for (f in t) if (__g.has(t, f) && !a--) break;
        o = !a;
      }
    }
    r.pop();
    e.pop();
    return o;
  };
  __g.isEqual = function(n, t) {
    return S(n, t, [], []);
  };
  __g.isEmpty = function(obj) {
    if (obj == null) return !0;
    if (__g.isArray(obj) || __g.isString(obj)) return obj.length === 0;
    for (var n in obj) if (__g.has(obj, n)) return !1;
    return !0;
  };
  __g.isElement = function(obj) {
    return obj && obj.nodeType === 1;
  };
  __g.isArray = F || function(obj) {
    return A.call(obj) == "[object Array]";
  };
  __g.isObject = function(obj) {
    return obj === Object(obj);
  };
  _([ "Arguments", "Function", "String", "Number", "Date", "RegExp" ], function(n) {
    __g["is" + n] = function(obj) {
      return A.call(obj) == "[object " + n + "]";
    };
  });
  __g.isArguments(arguments) || (__g.isArguments = function(obj) {
    return obj && __g.has(obj, "callee");
  });
  __g.isFunction = function(obj) {
    return typeof obj == "function";
  };
  __g.isFinite = function(obj) {
    return __g.isNumber(obj) && isFinite(obj);
  };
  __g.isNaN = function(obj) {
    return __g.isNumber(obj) && obj != +obj;
  };
  __g.isBoolean = function(obj) {
    return obj === !0 || obj === !1 || A.call(obj) == "[object Boolean]";
  };
  __g.isNull = function(obj) {
    return obj === null;
  };
  __g.isUndefined = function(obj) {
    return obj === void 0;
  };
  __g.has = function(obj, n) {
    return k.call(obj, n);
  };
  __g.identity = function(n) {
    return n;
  };
  __g.times = function(n, t, r) {
    for (var e = 0; n > e; e++) t.call(r, e);
  };
  __g.random = function(n, t) {
    if (t == null) {
      t = n;
      n = 0;
    }
    return n + (0 | Math.random() * (t - n + 1));
  };
  var C = {
    escape: {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;"
    }
  };
  C.unescape = __g.invert(C.escape);
  var P = {
    escape: RegExp("[" + __g.keys(C.escape).join("") + "]", "g"),
    unescape: RegExp("(" + __g.keys(C.unescape).join("|") + ")", "g")
  };
  __g.each([ "escape", "unescape" ], function(n) {
    __g[n] = function(t) {
      return t == null ? "" : ("" + t).replace(P[n], function(t) {
        return C[n][t];
      });
    };
  });
  __g.result = function(n, t) {
    if (n == null) return null;
    var r = n[t];
    return __g.isFunction(r) ? r.call(n) : r;
  };
  __g.mixin = function(obj) {
    _(__g.functions(obj), function(n) {
      var t = __g[n] = obj[n];
      __g.prototype[n] = function() {
        var n = [ this._wrapped ];
        j.apply(n, arguments);
        return D.call(this, t.apply(__g, n));
      };
    });
  };
  var z = 0;
  __g.uniqueId = function(n) {
    var t = z++;
    return n ? n + t : t;
  };
  __g.chain = function(obj) {
    return __g(obj).chain();
  };
  var D = function(obj) {
    return this._chain ? __g(obj).chain() : obj;
  };
  t = "object" == typeof exports && exports && ("object" == typeof global && global && global === global.global && (a = global), 
  exports);
  n(t);
  r = __g, e = "edge", i = "edge", u = a[i];
  r.noConflict = function() {
    a[i] = u;
    return this;
  };
  "function" == typeof define && "object" == typeof define.amd && define.amd ? (a[e] = r, 
  define(function() {
    return r;
  })) : t ? "object" == typeof module && module && module.exports === t ? (module.exports = r)[e] = r : t[e] = r : a[e] = r;
}).call(this);
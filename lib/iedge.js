(function() {
    var root, __Array, __String, __Object, __Function, __each, __map, __reduce, __right, __filter, __every, __some, __index, __last, __bind, push, slice, concat, toString, hasOwnProperty, __define, __keys, __isArray, __e, __instance, __name, __nms, __precedent, __break, __g, each, any, lookupIterator, group, flatten, ctor, eq, entityMap, entityRegexes, idCounter, result;
    function init(native) {
        return native && (__g.mixin(require("./mx.strings")), __g.until = function until(test, iterator, cb) {
            return test() ? cb() : (iterator(function(err) {
                return err ? cb(err) : (until(test, iterator, cb), void 0);
            }), void 0);
        }, __g.serial = function(func, cb) {
            function e(func, c) {
                func.length ? func.shift()(function(f, cb) {
                    f ? c(f, d) : (d.push(cb), e(func, c));
                }) : c(null, d);
            }
            var func = func.slice(0), d = [];
            e(func, cb);
        }, __g.parallel = function(func, cb) {
            var c, f, g, d, b;
            c = "object" == typeof func ? Object.keys(func).length : func.length, f = {}, g = !1, d = {}, c || cb(null, d);
            for (b in func) (function() {
                var i = func[b], h = b;
                pprocess.nextTick(function() {
                    i(function(func, b) {
                        func && (f[h] = func, g = !0), b && (d[h] = b), c--, 0 == c && cb(g ? f : null, d);
                    });
                });
            })();
        }, __g.serials = function(arr, ite, clb) {
            var fin, rst;
            return arr.length ? (fin = 0, rst = function() {
                ite(arr[fin], function(err) {
                    err ? (clb(err), clb = function() {}) : (fin++, fin == arr.length ? clb() : rst());
                });
            }, rst(), void 0) : clb();
        }, __g.arg = function(rgmt, sl) {
            !sl && (sl = 0);
            for (var b = sl, d = (rgmt || []).length, e = Array(d - sl); d > b; b++) e[b - sl] = rgmt[b];
            return e;
        }, __g.args = function(arg, sht) {
            var rst = __g.arg(arg), clb;
            return sht && !rst[0] ? rst.shift() : __define(rst, "first", {
                value: rst[0]
            }), clb = rst[rst.length - 1] || rst[rst.length], "function" == typeof clb && (__define(rst, "callback", {
                value: clb
            }), __define(rst, "next", {
                value: clb
            }), __define(rst, "cb", {
                value: clb
            }), rst.pop()), rst.length && __define(rst, "last", {
                value: rst[rst.length - 1]
            }), rst;
        }, __g.merging = function(obj, rif, cln, ign) {
            if (!obj || !rif) return null;
            ign = ign || [];
            var obj = cln ? __g.clone(obj) : obj, k;
            for (k in rif) !__g.include(ign, k) && (obj[k] = rif[k]);
            return obj;
        }, __g.uuid = function() {
            for (var a = [], b = 0; 36 > b; b++) a[b] = Math.floor(16 * Math.random());
            for (a[14] = 4, a[19] = a[19] & 3 | 8, b = 0; 36 > b; b++) a[b] = "0123456789ABCDEF";
            return a[8] = a[13] = a[18] = a[23] = "-", a.join("");
        }, __g.suction = function(obj, sip, ign, hol, ovr) {
            ign = ign || [], !Array.isArray(ign) && (ign = [ ign ]), !Array.isArray(hol) && (hol = [ hol ]), Object.keys(sip).forEach(function(k) {
                if (0 > ign.indexOf(k)) {
                    var nk = hol && (hol.indexOf(k) > 0 || hol[1] === "*") ? hol[0] + k : k;
                    obj.hasOwnProperty(k) ? ovr && (obj[nk] = sip[k]) : obj[nk] = sip[k];
                }
            });
        }), __g.mixin(__g), each([ "pop", "push", "reverse", "shift", "sort", "splice", "unshift" ], function(name) {
            var method = __Array[name];
            __g.prototype[name] = function() {
                var obj = this._wrapped;
                return method.apply(obj, arguments), name != "shift" && name != "splice" || obj.length !== 0 || delete obj[0], result.call(this, obj);
            };
        }), each([ "concat", "join", "slice" ], function(name) {
            var method = __Array[name];
            __g.prototype[name] = function() {
                return result.call(this, method.apply(this._wrapped, arguments));
            };
        }), __g.extend(__g.prototype, {
            chain: function() {
                return this._chain = !0, this;
            },
            value: function() {
                return this._wrapped;
            }
        }), native ? (__g.suction(__g, require("../modules/natives")), module.paths.unshift(__g.resolve(__dirname, "../modules")), __g.mixin(require("_engines/dtml")), __g.module = function(nm) {
            return require(nm);
        }, __g.modules = function(mod, ref) {
            var rst = {};
            return __g.each(mod.split(" "), function(v) {
                this[v] = __g.module(v);
            }, rst), ref ? __g.gc(rst) : rst;
        }, __g.patches = function(mods) {
            var _patches = require("patches");
            return __g.each(mods, function(v, k) {
                _patches.hasOwnProperty(k) && _patches[k](v);
            }, mods), mods;
        }, __g.gd = function(depth) {
            if (depth = depth || 0, depth === "native") return __g.merging(new __g(), require("../pac/native"), !0, [ "graceful" ]);
            if (depth === 0) {
                var _ins = __g.merging(this, require("../pac/all"), !0, [ "graceful" ]), gc = __g.gc(_ins);
                return delete gc.edge, gc;
            }
        }, void 0) : {};
    }
    root = this, __Array = Array.prototype, __String = String.prototype, __Object = Object.prototype, __Function = Function.prototype, __each = __Array.forEach, __map = __Array.map, __reduce = __Array.reduce, __right = __Array.reduceRight, __filter = __Array.filter, __every = __Array.every, __some = __Array.some, __index = __Array.indexOf, __last = __Array.lastIndexOf, __bind = __Function.bind, __index = __Array.indexOf, __last = __Array.lastIndexOf, push = __Array.push, slice = __Array.slice, concat = __Array.concat, toString = __Object.toString, hasOwnProperty = __Object.hasOwnProperty, __define = Object.defineProperty, __keys = Object.keys, __isArray = [].isArray, __bind = __Function.bind, __break = {}, __g = function(obj) {
        return obj instanceof __g ? obj : this instanceof __g ? (this._wrapped = obj, this) : new __g(obj);
    }, each = __g.each = __g.forEach = function(obj, iterator, context) {
        var i, l, key;
        if (__each && obj.forEach === __each) obj.forEach(iterator, context); else if (obj.length === +obj.length) {
            for (i = 0, l = obj.length; l > i; i++) if (iterator.call(context, obj[i], i, obj) === __break) return;
        } else for (key in obj) if (__g.has(obj, key) && iterator.call(context, obj[key], key, obj) === __break) return;
    }, __g.map = __g.collect = function(obj, iterator, context) {
        var results = [];
        return __map && obj.map === __map ? obj.map(iterator, context) : (each(obj, function(value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        }), results);
    }, __g.reduce = __g.foldl = __g.inject = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (__reduce && obj.reduce === __reduce) return context && (iterator = __g.bind(iterator, context)), initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        if (each(obj, function(value, index, list) {
            initial ? memo = iterator.call(context, memo, value, index, list) : (memo = value, initial = !0);
        }), !initial) throw new TypeError("Reduce of empty array with no initial value");
        return memo;
    }, __g.reduceRight = __g.foldr = function(obj, iterator, memo, context) {
        var initial, length, keys;
        if (initial = arguments.length > 2, __right && obj.reduceRight === __right) return context && (iterator = __g.bind(iterator, context)), arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
        if (length = obj.length, length !== +length && (keys = __g.keys(obj), length = keys.length), each(obj, function(value, index, list) {
            index = keys ? keys[--length] : --length, initial ? memo = iterator.call(context, memo, obj[index], index, list) : (memo = obj[index], initial = !0);
        }), !initial) throw new TypeError("Reduce of empty array with no initial value");
        return memo;
    }, __g.find = __g.detect = function(obj, iterator, context) {
        var result;
        return any(obj, function(value, index, list) {
            return iterator.call(context, value, index, list) ? (result = value, !0) : void 0;
        }), result;
    }, __g.filter = __g.select = function(obj, iterator, context) {
        var results = [];
        return __filter && obj.filter === __filter ? obj.filter(iterator, context) : (each(obj, function(value, index, list) {
            iterator.call(context, value, index, list) && (results[results.length] = value);
        }), results);
    }, __g.reject = function(obj, iterator, context) {
        var results = [];
        return each(obj, function(value, index, list) {
            iterator.call(context, value, index, list) || (results[results.length] = value);
        }), results;
    }, __g.every = __g.all = function(obj, iterator, context) {
        iterator || (iterator = __g.identity);
        var result = !0;
        return __every && obj.every === __every ? obj.every(iterator, context) : (each(obj, function(value, index, list) {
            return (result = result && iterator.call(context, value, index, list)) ? void 0 : __break;
        }), !!result);
    }, any = __g.some = __g.any = function(obj, iterator, context) {
        iterator || (iterator = __g.identity);
        var result = !1;
        return __some && obj.some === __some ? obj.some(iterator, context) : (each(obj, function(value, index, list) {
            return result || (result = iterator.call(context, value, index, list)) ? __break : void 0;
        }), !!result);
    }, __g.contains = __g.include = function(obj, target) {
        var found = !1;
        return __index && obj.indexOf === __index ? obj.indexOf(target) != -1 : found = any(obj, function(value) {
            return value === target;
        });
    }, __g.invoke = function(obj, method) {
        var args = slice.call(arguments, 2);
        return __g.map(obj, function(value) {
            return (__g.isFunction(method) ? method : value[method]).apply(value, args);
        });
    }, __g.pluck = function(obj, key) {
        return __g.map(obj, function(value) {
            return value[key];
        });
    }, __g.where = function(obj, attrs) {
        return __g.isEmpty(attrs) ? [] : __g.filter(obj, function(value) {
            for (var key in attrs) if (attrs[key] !== value[key]) return !1;
            return !0;
        });
    }, __g.max = function(obj, iterator, context) {
        if (!iterator && __g.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.max.apply(Math, obj);
        if (!iterator && __g.isEmpty(obj)) return -Infinity;
        var result = {
            computed: -Infinity
        };
        return each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed >= result.computed && (result = {
                value: value,
                computed: computed
            });
        }), result.value;
    }, __g.min = function(obj, iterator, context) {
        if (!iterator && __g.isArray(obj) && obj[0] === +obj[0] && 65535 > obj.length) return Math.min.apply(Math, obj);
        if (!iterator && __g.isEmpty(obj)) return Infinity;
        var result = {
            computed: Infinity
        };
        return each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            result.computed > computed && (result = {
                value: value,
                computed: computed
            });
        }), result.value;
    }, __g.shuffle = function(obj) {
        var rand, index, shuffled;
        return index = 0, shuffled = [], each(obj, function(value) {
            rand = __g.random(index++), shuffled[index - 1] = shuffled[rand], shuffled[rand] = value;
        }), shuffled;
    }, lookupIterator = function(value) {
        return __g.isFunction(value) ? value : function(obj) {
            return obj[value];
        };
    }, __g.sortBy = function(obj, value, context) {
        var iterator = lookupIterator(value);
        return __g.pluck(__g.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function(left, right) {
            var a, b;
            if (a = left.criteria, b = right.criteria, a !== b) {
                if (a > b || a === void 0) return 1;
                if (b > a || b === void 0) return -1;
            }
            return right.index > left.index ? -1 : 1;
        }), "value");
    }, group = function(obj, value, context, behavior) {
        var result, iterator;
        return result = {}, iterator = lookupIterator(value), each(obj, function(value, index) {
            var key = iterator.call(context, value, index, obj);
            behavior(result, key, value);
        }), result;
    }, __g.groupBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key, value) {
            (__g.has(result, key) ? result[key] : result[key] = []).push(value);
        });
    }, __g.countBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key, value) {
            __g.has(result, key) || (result[key] = 0), result[key]++;
        });
    }, __g.sortedIndex = function(array, obj, iterator, context) {
        var value, low, high, mid;
        iterator = iterator == null ? __g.identity : lookupIterator(iterator), value = iterator.call(context, obj), low = 0, high = array.length;
        while (high > low) mid = low + high >>> 1, value > iterator.call(context, array[mid]) ? low = mid + 1 : high = mid;
        return low;
    }, __g.toArray = function(obj) {
        return obj ? obj.length === +obj.length ? slice.call(obj) : __g.values(obj) : [];
    }, __g.size = function(obj) {
        return obj.length === +obj.length ? obj.length : __g.keys(obj).length;
    }, __g.first = __g.head = __g.take = function(array, n, guard) {
        return n == null || guard ? array[0] : slice.call(array, 0, n);
    }, __g.initial = function(array, n, guard) {
        return slice.call(array, 0, array.length - (n == null || guard ? 1 : n));
    }, __g.last = function(array, n, guard) {
        return n == null || guard ? array[array.length - 1] : slice.call(array, Math.max(array.length - n, 0));
    }, __g.rest = __g.tail = __g.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    }, __g.compact = function(array) {
        return __g.filter(array, function(value) {
            return !!value;
        });
    }, flatten = function(input, shallow, output) {
        return each(input, function(value) {
            __g.isArray(value) ? shallow ? push.apply(output, value) : flatten(value, shallow, output) : output.push(value);
        }), output;
    }, __g.flatten = function(array, shallow) {
        return flatten(array, shallow, []);
    }, __g.without = function(array) {
        return __g.difference(array, slice.call(arguments, 1));
    }, __g.uniq = __g.unique = function(array, isSorted, iterator, context) {
        var initial, results, seen;
        return initial = iterator ? __g.map(array, iterator, context) : array, results = [], seen = [], each(initial, function(value, index) {
            (isSorted ? index && seen[seen.length - 1] === value : __g.contains(seen, value)) || (seen.push(value), results.push(array[index]));
        }), results;
    }, __g.union = function() {
        return __g.uniq(concat.apply(__Array, arguments));
    }, __g.intersection = function(array) {
        var rest = slice.call(arguments, 1);
        return __g.filter(__g.uniq(array), function(item) {
            return __g.every(rest, function(other) {
                return __g.indexOf(other, item) >= 0;
            });
        });
    }, __g.difference = function(array) {
        var rest = concat.apply(__Array, slice.call(arguments, 1));
        return __g.filter(array, function(value) {
            return !__g.contains(rest, value);
        });
    }, __g.zip = function() {
        var args, length, results, i;
        for (args = slice.call(arguments), length = __g.max(__g.pluck(args, "length")), results = Array(length), i = 0; length > i; i++) results[i] = __g.pluck(args, "" + i);
        return results;
    }, __g.object = function(list, values) {
        var result, i, l;
        for (result = {}, i = 0, l = list.length; l > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
        return result;
    }, __g.indexOf = function(array, item, isSorted) {
        var i = 0, l = array.length;
        if (isSorted) {
            if (typeof isSorted != "number") return i = __g.sortedIndex(array, item), array[i] === item ? i : -1;
            i = 0 > isSorted ? Math.max(0, l + isSorted) : isSorted;
        }
        if (__index && array.indexOf === __index) return array.indexOf(item, isSorted);
        for (;l > i; i++) if (array[i] === item) return i;
        return -1;
    }, __g.lastIndexOf = function(array, item, from) {
        var hasIndex, i;
        if (hasIndex = from != null, __last && array.lastIndexOf === __last) return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
        i = hasIndex ? from : array.length;
        while (i--) if (array[i] === item) return i;
        return -1;
    }, __g.range = function(start, stop, step) {
        var len, idx, range;
        arguments.length > 1 || (stop = start || 0, start = 0), step = arguments[2] || 1, len = Math.max(Math.ceil((stop - start) / step), 0), idx = 0, range = Array(len);
        while (len > idx) range[idx++] = start, start += step;
        return range;
    }, ctor = function() {}, __g.bind = function(func, context) {
        var bound, args;
        if (func.bind === __bind && __bind) return __bind.apply(func, slice.call(arguments, 1));
        if (!__g.isFunction(func)) throw new TypeError();
        return args = slice.call(arguments, 2), bound = function() {
            var self, result;
            return this instanceof bound ? (ctor.prototype = func.prototype, self = new ctor(), result = func.apply(self, args.concat(slice.call(arguments))), Object(result) === result ? result : self) : func.apply(context, args.concat(slice.call(arguments)));
        };
    }, __g.bindAll = function(obj) {
        var funcs = slice.call(arguments, 1);
        return funcs.length == 0 && (funcs = __g.functions(obj)), each(funcs, function(f) {
            obj[f] = __g.bind(obj[f], obj);
        }), obj;
    }, __g.memoize = function(func, hasher) {
        var memo = {};
        return hasher || (hasher = __g.identity), function() {
            var key = hasher.apply(this, arguments);
            return __g.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments);
        };
    }, __g.delay = function(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    }, __g.defer = function(func) {
        return __g.delay.apply(__g, [ func, 1 ].concat(slice.call(arguments, 1)));
    }, __g.throttle = function(func, wait) {
        var context, args, timeout, throttling, more, result, whenDone;
        return whenDone = __g.debounce(function() {
            more = throttling = !1;
        }, wait), function() {
            context = this, args = arguments;
            var later = function() {
                timeout = null, more && (result = func.apply(context, args)), whenDone();
            };
            return timeout || (timeout = setTimeout(later, wait)), throttling ? more = !0 : (throttling = !0, result = func.apply(context, args)), whenDone(), result;
        };
    }, __g.debounce = function(func, wait, immediate) {
        var timeout, result;
        return function() {
            var context, args, later, callNow;
            return context = this, args = arguments, later = function() {
                timeout = null, immediate || (result = func.apply(context, args));
            }, callNow = immediate && !timeout, clearTimeout(timeout), timeout = setTimeout(later, wait), callNow && (result = func.apply(context, args)), result;
        };
    }, __g.once = function(func) {
        var ran = !1, memo;
        return function() {
            return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo);
        };
    }, __g.wrap = function(func, wrapper) {
        return function() {
            var args = [ func ];
            return push.apply(args, arguments), wrapper.apply(this, args);
        };
    }, __g.compose = function() {
        var funcs = arguments;
        return function() {
            var args, i;
            for (args = arguments, i = funcs.length - 1; i >= 0; i--) args = [ funcs[i].apply(this, args) ];
            return args[0];
        };
    }, __g.after = function(times, func) {
        return times > 0 ? function() {
            return 1 > --times ? func.apply(this, arguments) : void 0;
        } : func();
    }, __g.keys = __keys || function(obj) {
        var keys, key;
        if (obj !== Object(obj)) throw new TypeError("Invalid object");
        keys = [];
        for (key in obj) __g.has(obj, key) && (keys[keys.length] = key);
        return keys;
    }, __g.values = function(obj) {
        var values, key;
        values = [];
        for (key in obj) __g.has(obj, key) && values.push(obj[key]);
        return values;
    }, __g.pairs = function(obj) {
        var pairs, key;
        pairs = [];
        for (key in obj) __g.has(obj, key) && pairs.push([ key, obj[key] ]);
        return pairs;
    }, __g.invert = function(obj) {
        var result, key;
        result = {};
        for (key in obj) __g.has(obj, key) && (result[obj[key]] = key);
        return result;
    }, __g.functions = __g.methods = function(obj) {
        var names, key;
        names = [];
        for (key in obj) __g.isFunction(obj[key]) && names.push(key);
        return names.sort();
    }, __g.extend = function(obj) {
        return each(slice.call(arguments, 1), function(source) {
            for (var prop in source) obj[prop] = source[prop];
        }), obj;
    }, __g.pick = function(obj) {
        var copy, keys;
        return copy = {}, keys = concat.apply(__Array, slice.call(arguments, 1)), each(keys, function(key) {
            key in obj && (copy[key] = obj[key]);
        }), copy;
    }, __g.omit = function(obj) {
        var copy, keys, key;
        copy = {}, keys = concat.apply(__Array, slice.call(arguments, 1));
        for (key in obj) __g.contains(keys, key) || (copy[key] = obj[key]);
        return copy;
    }, __g.defaults = function(obj) {
        return each(slice.call(arguments, 1), function(source) {
            for (var prop in source) obj[prop] == null && (obj[prop] = source[prop]);
        }), obj;
    }, __g.clone = function(obj) {
        return __g.isObject(obj) ? __g.isArray(obj) ? obj.slice() : __g.extend({}, obj) : obj;
    }, __g.tap = function(obj, interceptor) {
        return interceptor(obj), obj;
    }, eq = function(a, b, aStack, bStack) {
        var className, length, size, result, aCtor, bCtor, key;
        if (a === b) return a !== 0 || 1 / a == 1 / b;
        if (a == null || b == null) return a === b;
        if (a instanceof __g && (a = a._wrapped), b instanceof __g && (b = b._wrapped), className = toString.call(a), className != toString.call(b)) return !1;
        switch (className) {
          case "[object String]":
            return a == b + "";

          case "[object Number]":
            return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;

          case "[object Date]":
          case "[object Boolean]":
            return +a == +b;

          case "[object RegExp]":
            return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != "object" || typeof b != "object") return !1;
        length = aStack.length;
        while (length--) if (aStack[length] == a) return bStack[length] == b;
        if (aStack.push(a), bStack.push(b), size = 0, result = !0, className == "[object Array]") {
            if (size = a.length, result = size == b.length) while (size--) if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        } else {
            if (aCtor = a.constructor, bCtor = b.constructor, aCtor !== bCtor && !(__g.isFunction(aCtor) && aCtor instanceof aCtor && __g.isFunction(bCtor) && bCtor instanceof bCtor)) return !1;
            for (key in a) if (__g.has(a, key) && (size++, !(result = __g.has(b, key) && eq(a[key], b[key], aStack, bStack)))) break;
            if (result) {
                for (key in b) if (__g.has(b, key) && !size--) break;
                result = !size;
            }
        }
        return aStack.pop(), bStack.pop(), result;
    }, __g.isEqual = function(a, b) {
        return eq(a, b, [], []);
    }, __g.isEmpty = function(obj) {
        if (obj == null) return !0;
        if (__g.isArray(obj) || __g.isString(obj)) return obj.length === 0;
        for (var key in obj) if (__g.has(obj, key)) return !1;
        return !0;
    }, __g.isElement = function(obj) {
        return obj && obj.nodeType === 1;
    }, __g.isArray = __isArray || function(obj) {
        return toString.call(obj) == "[object Array]";
    }, __g.isObject = function(obj) {
        return obj === Object(obj);
    }, each([ "Arguments", "Function", "String", "Number", "Date", "RegExp" ], function(name) {
        __g["is" + name] = function(obj) {
            return toString.call(obj) == "[object " + name + "]";
        };
    }), __g.isArguments(arguments) || (__g.isArguments = function(obj) {
        return obj && __g.has(obj, "callee");
    }), __g.isFunction = function(obj) {
        return typeof obj == "function";
    }, __g.isFinite = function(obj) {
        return __g.isNumber(obj) && isFinite(obj);
    }, __g.isNaN = function(obj) {
        return __g.isNumber(obj) && obj != +obj;
    }, __g.isBoolean = function(obj) {
        return obj === !0 || obj === !1 || toString.call(obj) == "[object Boolean]";
    }, __g.isNull = function(obj) {
        return obj === null;
    }, __g.isUndefined = function(obj) {
        return obj === void 0;
    }, __g.has = function(obj, key) {
        return hasOwnProperty.call(obj, key);
    }, __g.identity = function(value) {
        return value;
    }, __g.times = function(n, iterator, context) {
        for (var i = 0; n > i; i++) iterator.call(context, i);
    }, __g.random = function(min, max) {
        return max == null && (max = min, min = 0), min + (0 | Math.random() * (max - min + 1));
    }, entityMap = {
        escape: {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;"
        }
    }, entityMap.unescape = __g.invert(entityMap.escape), entityRegexes = {
        escape: RegExp("[" + __g.keys(entityMap.escape).join("") + "]", "g"),
        unescape: RegExp("(" + __g.keys(entityMap.unescape).join("|") + ")", "g")
    }, __g.each([ "escape", "unescape" ], function(method) {
        __g[method] = function(string) {
            return string == null ? "" : ("" + string).replace(entityRegexes[method], function(match) {
                return entityMap[method][match];
            });
        };
    }), __g.result = function(object, property) {
        if (object == null) return null;
        var value = object[property];
        return __g.isFunction(value) ? value.call(object) : value;
    }, __g.mixin = function(obj) {
        each(__g.functions(obj), function(name) {
            var func = __g[name] = obj[name];
            __g.prototype[name] = function() {
                var args = [ this._wrapped ];
                return push.apply(args, arguments), result.call(this, func.apply(__g, args));
            };
        });
    }, idCounter = 0, __g.uniqueId = function(prefix) {
        var id = idCounter++;
        return prefix ? prefix + id : id;
    }, __g.chain = function(obj) {
        return __g(obj).chain();
    }, result = function(obj) {
        return this._chain ? __g(obj).chain() : obj;
    }, __e = "object" == typeof exports && exports && ("object" == typeof global && global && global === global.global && (root = global), exports), init(__e), __instance = __g, __name = "edge", __nms = "edge", __precedent = root[__nms], __instance.noConflict = function() {
        return root[__nms] = __precedent, this;
    }, "function" == typeof define && "object" == typeof define.amd && define.amd ? (root[__name] = __instance, define(function() {
        return __instance;
    })) : __e ? "object" == typeof module && module && module.exports === __e ? (module.exports = __instance)[__name] = __instance : __e[__name] = __instance : root[__name] = __instance;
}).call(this);
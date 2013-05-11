(function() {
  /** underscorejs 1.4
   * ==============================================================================================
   * defendence 
   * ==============================================================================================
  */
    var root = this;
    //[] :________________________________
    var __Array     = Array.prototype
      , __String    = String.prototype
      , __Object    = Object.prototype
      , __Function  = Function.prototype
      , __each      = __Array.forEach
      , __map       = __Array.map
      , __reduce    = __Array.reduce
      , __right     = __Array.reduceRight
      , __filter    = __Array.filter
      , __every     = __Array.every
      , __some      = __Array.some
      , __index     = __Array.indexOf
      , __last      = __Array.lastIndexOf
      , __bind      = __Function.bind
      , __trim      = __String.trim
      , __ltrim     = __String.trimLeft
      , __rtrim     = __String.trimRight
      , __index     = __Array.indexOf
      , __last      = __Array.lastIndexOf
    ;//[] :______________________________
    var push        = __Array.push
      , slice       = __Array.slice
      , concat      = __Array.concat
      , unshift     = __Array.unshift
      , toString    = __Object.toString
      , hasOwnProperty = __Object.hasOwnProperty
    ;//[] :______________________________
    var __define    = Object.defineProperty
      , __keys      = Object.keys
      , __isArray   = [].isArray
      , __bind      = __Function.bind
    ;//[] :______________________________
    var __e, __instance, __name, __nms, __precedent, __break = {}
    ;//[] :______________________________

    var __g = function(obj) {
      if (obj instanceof __g) return obj;
      if (!(this instanceof __g)) return new __g(obj);
      this._wrapped = obj;
      return this;
    };

    var each = __g.each = __g.forEach = function(obj, iterator, context) {
        if (__each && obj.forEach === __each) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === __break) return;
            }
        } else {
            for (var key in obj) {
                if (__g.has(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === __break) return;
                }
            }
        }
    };
    __g.map = __g.collect = function(obj, iterator, context) {
        var results = [];
        if (__map && obj.map === __map) return obj.map(iterator, context);
        each(obj, function(value, index, list) {
            results[results.length] = iterator.call(context, value, index, list);
        });
        return results;
    };
    __g.reduce = __g.foldl = __g.inject = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (__reduce && obj.reduce === __reduce) {
            if (context) iterator = __g.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
        }
        each(obj, function(value, index, list) {
            if (!initial) {
                memo = value;
                initial = true;
            } else {
                memo = iterator.call(context, memo, value, index, list);
            }
        });
        if (!initial) throw new TypeError("Reduce of empty array with no initial value");
        return memo;
    };
    __g.reduceRight = __g.foldr = function(obj, iterator, memo, context) {
        var initial = arguments.length > 2;
        if (__right && obj.reduceRight === __right) {
            if (context) iterator = __g.bind(iterator, context);
            return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
        }
        var length = obj.length;
        if (length !== +length) {
            var keys = __g.keys(obj);
            length = keys.length;
        }
        each(obj, function(value, index, list) {
            index = keys ? keys[--length] : --length;
            if (!initial) {
                memo = obj[index];
                initial = true;
            } else {
                memo = iterator.call(context, memo, obj[index], index, list);
            }
        });
        if (!initial) throw new TypeError("Reduce of empty array with no initial value");
        return memo;
    };
    __g.find = __g.detect = function(obj, iterator, context) {
        var result;
        any(obj, function(value, index, list) {
            if (iterator.call(context, value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    };
    __g.filter = __g.select = function(obj, iterator, context) {
        var results = [];
        if (__filter && obj.filter === __filter) return obj.filter(iterator, context);
        each(obj, function(value, index, list) {
            if (iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };
    __g.reject = function(obj, iterator, context) {
        var results = [];
        each(obj, function(value, index, list) {
            if (!iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };
    __g.every = __g.all = function(obj, iterator, context) {
        iterator || (iterator = __g.identity);
        var result = true;
        if (__every && obj.every === __every) return obj.every(iterator, context);
        each(obj, function(value, index, list) {
            if (!(result = result && iterator.call(context, value, index, list))) return __break;
        });
        return !!result;
    };
    var any = __g.some = __g.any = function(obj, iterator, context) {
        iterator || (iterator = __g.identity);
        var result = false;
        if (__some && obj.some === __some) return obj.some(iterator, context);
        each(obj, function(value, index, list) {
            if (result || (result = iterator.call(context, value, index, list))) return __break;
        });
        return !!result;
    };
    __g.contains = __g.include = function(obj, target) {
        var found = false;
        if (__index && obj.indexOf === __index) return obj.indexOf(target) != -1;
        found = any(obj, function(value) {
            return value === target;
        });
        return found;
    };
    __g.invoke = function(obj, method) {
        var args = slice.call(arguments, 2);
        return __g.map(obj, function(value) {
            return (__g.isFunction(method) ? method : value[method]).apply(value, args);
        });
    };
    __g.pluck = function(obj, key) {
        return __g.map(obj, function(value) {
            return value[key];
        });
    };
    __g.where = function(obj, attrs) {
        if (__g.isEmpty(attrs)) return [];
        return __g.filter(obj, function(value) {
            for (var key in attrs) {
                if (attrs[key] !== value[key]) return false;
            }
            return true;
        });
    };
    __g.max = function(obj, iterator, context) {
        if (!iterator && __g.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.max.apply(Math, obj);
        }
        if (!iterator && __g.isEmpty(obj)) return -Infinity;
        var result = {
            computed: -Infinity
        };
        each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed >= result.computed && (result = {
                value: value,
                computed: computed
            });
        });
        return result.value;
    };
    __g.min = function(obj, iterator, context) {
        if (!iterator && __g.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.min.apply(Math, obj);
        }
        if (!iterator && __g.isEmpty(obj)) return Infinity;
        var result = {
            computed: Infinity
        };
        each(obj, function(value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            computed < result.computed && (result = {
                value: value,
                computed: computed
            });
        });
        return result.value;
    };
    __g.shuffle = function(obj) {
        var rand;
        var index = 0;
        var shuffled = [];
        each(obj, function(value) {
            rand = __g.random(index++);
            shuffled[index - 1] = shuffled[rand];
            shuffled[rand] = value;
        });
        return shuffled;
    };
    var lookupIterator = function(value) {
        return __g.isFunction(value) ? value : function(obj) {
            return obj[value];
        };
    };
    __g.sortBy = function(obj, value, context) {
        var iterator = lookupIterator(value);
        return __g.pluck(__g.map(obj, function(value, index, list) {
            return {
                value: value,
                index: index,
                criteria: iterator.call(context, value, index, list)
            };
        }).sort(function(left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index < right.index ? -1 : 1;
        }), "value");
    };
    var group = function(obj, value, context, behavior) {
        var result = {};
        var iterator = lookupIterator(value);
        each(obj, function(value, index) {
            var key = iterator.call(context, value, index, obj);
            behavior(result, key, value);
        });
        return result;
    };
    __g.groupBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key, value) {
            (__g.has(result, key) ? result[key] : result[key] = []).push(value);
        });
    };
    __g.countBy = function(obj, value, context) {
        return group(obj, value, context, function(result, key, value) {
            if (!__g.has(result, key)) result[key] = 0;
            result[key]++;
        });
    };
    __g.sortedIndex = function(array, obj, iterator, context) {
        iterator = iterator == null ? __g.identity : lookupIterator(iterator);
        var value = iterator.call(context, obj);
        var low = 0, high = array.length;
        while (low < high) {
            var mid = low + high >>> 1;
            iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
        }
        return low;
    };
    __g.toArray = function(obj) {
        if (!obj) return [];
        if (obj.length === +obj.length) return slice.call(obj);
        return __g.values(obj);
    };
    __g.size = function(obj) {
        return obj.length === +obj.length ? obj.length : __g.keys(obj).length;
    };
    __g.first = __g.head = __g.take = function(array, n, guard) {
        return n != null && !guard ? slice.call(array, 0, n) : array[0];
    };
    __g.initial = function(array, n, guard) {
        return slice.call(array, 0, array.length - (n == null || guard ? 1 : n));
    };
    __g.last = function(array, n, guard) {
        if (n != null && !guard) {
            return slice.call(array, Math.max(array.length - n, 0));
        } else {
            return array[array.length - 1];
        }
    };
    __g.rest = __g.tail = __g.drop = function(array, n, guard) {
        return slice.call(array, n == null || guard ? 1 : n);
    };
    __g.compact = function(array) {
        return __g.filter(array, function(value) {
            return !!value;
        });
    };
    var flatten = function(input, shallow, output) {
        each(input, function(value) {
            if (__g.isArray(value)) {
                shallow ? push.apply(output, value) : flatten(value, shallow, output);
            } else {
                output.push(value);
            }
        });
        return output;
    };
    __g.flatten = function(array, shallow) {
        return flatten(array, shallow, []);
    };
    __g.without = function(array) {
        return __g.difference(array, slice.call(arguments, 1));
    };
    __g.uniq = __g.unique = function(array, isSorted, iterator, context) {
        var initial = iterator ? __g.map(array, iterator, context) : array;
        var results = [];
        var seen = [];
        each(initial, function(value, index) {
            if (isSorted ? !index || seen[seen.length - 1] !== value : !__g.contains(seen, value)) {
                seen.push(value);
                results.push(array[index]);
            }
        });
        return results;
    };
    __g.union = function() {
        return __g.uniq(concat.apply(__Array, arguments));
    };
    __g.intersection = function(array) {
        var rest = slice.call(arguments, 1);
        return __g.filter(__g.uniq(array), function(item) {
            return __g.every(rest, function(other) {
                return __g.indexOf(other, item) >= 0;
            });
        });
    };
    __g.difference = function(array) {
        var rest = concat.apply(__Array, slice.call(arguments, 1));
        return __g.filter(array, function(value) {
            return !__g.contains(rest, value);
        });
    };
    __g.zip = function() {
        var args = slice.call(arguments);
        var length = __g.max(__g.pluck(args, "length"));
        var results = new Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = __g.pluck(args, "" + i);
        }
        return results;
    };
    __g.object = function(list, values) {
        var result = {};
        for (var i = 0, l = list.length; i < l; i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][1];
            }
        }
        return result;
    };
    __g.indexOf = function(array, item, isSorted) {
        var i = 0, l = array.length;
        if (isSorted) {
            if (typeof isSorted == "number") {
                i = isSorted < 0 ? Math.max(0, l + isSorted) : isSorted;
            } else {
                i = __g.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
        }
        if (__index && array.indexOf === __index) return array.indexOf(item, isSorted);
        for (;i < l; i++) if (array[i] === item) return i;
        return -1;
    };
    __g.lastIndexOf = function(array, item, from) {
        var hasIndex = from != null;
        if (__last && array.lastIndexOf === __last) {
            return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
        }
        var i = hasIndex ? from : array.length;
        while (i--) if (array[i] === item) return i;
        return -1;
    };
    __g.range = function(start, stop, step) {
        if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
        }
        step = arguments[2] || 1;
        var len = Math.max(Math.ceil((stop - start) / step), 0);
        var idx = 0;
        var range = new Array(len);
        while (idx < len) {
            range[idx++] = start;
            start += step;
        }
        return range;
    };
    var ctor = function() {};
    __g.bind = function bind(func, context) {
        var bound, args;
        if (func.bind === __bind && __bind) return __bind.apply(func, slice.call(arguments, 1));
        if (!__g.isFunction(func)) throw new TypeError();
        args = slice.call(arguments, 2);
        return bound = function() {
            if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
            ctor.prototype = func.prototype;
            var self = new ctor();
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) return result;
            return self;
        };
    };
    __g.bindAll = function(obj) {
        var funcs = slice.call(arguments, 1);
        if (funcs.length == 0) funcs = __g.functions(obj);
        each(funcs, function(f) {
            obj[f] = __g.bind(obj[f], obj);
        });
        return obj;
    };
    __g.memoize = function(func, hasher) {
        var memo = {};
        hasher || (hasher = __g.identity);
        return function() {
            var key = hasher.apply(this, arguments);
            return __g.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments);
        };
    };
    __g.delay = function(func, wait) {
        var args = slice.call(arguments, 2);
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    };
    __g.defer = function(func) {
        return __g.delay.apply(__g, [ func, 1 ].concat(slice.call(arguments, 1)));
    };
    __g.throttle = function(func, wait) {
        var context, args, timeout, throttling, more, result;
        var whenDone = __g.debounce(function() {
            more = throttling = false;
        }, wait);
        return function() {
            context = this;
            args = arguments;
            var later = function() {
                timeout = null;
                if (more) {
                    result = func.apply(context, args);
                }
                whenDone();
            };
            if (!timeout) timeout = setTimeout(later, wait);
            if (throttling) {
                more = true;
            } else {
                throttling = true;
                result = func.apply(context, args);
            }
            whenDone();
            return result;
        };
    };
    __g.debounce = function(func, wait, immediate) {
        var timeout, result;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) result = func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) result = func.apply(context, args);
            return result;
        };
    };
    __g.once = function(func) {
        var ran = false, memo;
        return function() {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
        };
    };
    __g.wrap = function(func, wrapper) {
        return function() {
            var args = [ func ];
            push.apply(args, arguments);
            return wrapper.apply(this, args);
        };
    };
    __g.compose = function() {
        var funcs = arguments;
        return function() {
            var args = arguments;
            for (var i = funcs.length - 1; i >= 0; i--) {
                args = [ funcs[i].apply(this, args) ];
            }
            return args[0];
        };
    };
    __g.after = function(times, func) {
        if (times <= 0) return func();
        return function() {
            if (--times < 1) {
                return func.apply(this, arguments);
            }
        };
    };
    __g.keys = __keys || function(obj) {
        if (obj !== Object(obj)) throw new TypeError("Invalid object");
        var keys = [];
        for (var key in obj) if (__g.has(obj, key)) keys[keys.length] = key;
        return keys;
    };
    __g.values = function(obj) {
        var values = [];
        for (var key in obj) if (__g.has(obj, key)) values.push(obj[key]);
        return values;
    };
    __g.pairs = function(obj) {
        var pairs = [];
        for (var key in obj) if (__g.has(obj, key)) pairs.push([ key, obj[key] ]);
        return pairs;
    };
    __g.invert = function(obj) {
        var result = {};
        for (var key in obj) if (__g.has(obj, key)) result[obj[key]] = key;
        return result;
    };
    __g.functions = __g.methods = function(obj) {
        var names = [];
        for (var key in obj) {
            if (__g.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };
    __g.extend = function(obj) {
        each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        });
        return obj;
    };
    __g.pick = function(obj) {
        var copy = {};
        var keys = concat.apply(__Array, slice.call(arguments, 1));
        each(keys, function(key) {
            if (key in obj) copy[key] = obj[key];
        });
        return copy;
    };
    __g.omit = function(obj) {
        var copy = {};
        var keys = concat.apply(__Array, slice.call(arguments, 1));
        for (var key in obj) {
            if (!__g.contains(keys, key)) copy[key] = obj[key];
        }
        return copy;
    };
    __g.defaults = function(obj) {
        each(slice.call(arguments, 1), function(source) {
            for (var prop in source) {
                if (obj[prop] == null) obj[prop] = source[prop];
            }
        });
        return obj;
    };
    __g.clone = function(obj) {
        if (!__g.isObject(obj)) return obj;
        return __g.isArray(obj) ? obj.slice() : __g.extend({}, obj);
    };
    __g.tap = function(obj, interceptor) {
        interceptor(obj);
        return obj;
    };
    var eq = function(a, b, aStack, bStack) {
        if (a === b) return a !== 0 || 1 / a == 1 / b;
        if (a == null || b == null) return a === b;
        if (a instanceof __g) a = a._wrapped;
        if (b instanceof __g) b = b._wrapped;
        var className = toString.call(a);
        if (className != toString.call(b)) return false;
        switch (className) {
          case "[object String]":
            return a == String(b);

          case "[object Number]":
            return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;

          case "[object Date]":
          case "[object Boolean]":
            return +a == +b;

          case "[object RegExp]":
            return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != "object" || typeof b != "object") return false;
        var length = aStack.length;
        while (length--) {
            if (aStack[length] == a) return bStack[length] == b;
        }
        aStack.push(a);
        bStack.push(b);
        var size = 0, result = true;
        if (className == "[object Array]") {
            size = a.length;
            result = size == b.length;
            if (result) {
                while (size--) {
                    if (!(result = eq(a[size], b[size], aStack, bStack))) break;
                }
            }
        } else {
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(__g.isFunction(aCtor) && aCtor instanceof aCtor && __g.isFunction(bCtor) && bCtor instanceof bCtor)) {
                return false;
            }
            for (var key in a) {
                if (__g.has(a, key)) {
                    size++;
                    if (!(result = __g.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
                }
            }
            if (result) {
                for (key in b) {
                    if (__g.has(b, key) && !size--) break;
                }
                result = !size;
            }
        }
        aStack.pop();
        bStack.pop();
        return result;
    };
    __g.isEqual = function(a, b) {
        return eq(a, b, [], []);
    };
    __g.isEmpty = function(obj) {
        if (obj == null) return true;
        if (__g.isArray(obj) || __g.isString(obj)) return obj.length === 0;
        for (var key in obj) if (__g.has(obj, key)) return false;
        return true;
    };
    __g.isElement = function(obj) {
        return !!(obj && obj.nodeType === 1);
    };
    __g.isArray = __isArray || function(obj) {
        return toString.call(obj) == "[object Array]";
    };
    __g.isObject = function(obj, strict) {
        strict =  strict ? toString.call(obj) === "[object Object]" : true;
        return strict && obj === Object(obj)
    };
    each([ "Arguments", "Function", "String", "Number", "Date", "RegExp" ], function(name) {
        __g["is" + name] = function(obj) {
            return toString.call(obj) == "[object " + name + "]";
        };
    });
    if (!__g.isArguments(arguments)) {
        __g.isArguments = function(obj) {
            return !!(obj && __g.has(obj, "callee"));
        };
    }
    if (typeof /./ !== "function") {
        __g.isFunction = function(obj) {
            return typeof obj === "function";
        };
    }
    __g.isFinite = function(obj) {
        return __g.isNumber(obj) && isFinite(obj);
    };
    __g.isNaN = function(obj) {
        return __g.isNumber(obj) && obj != +obj;
    };
    __g.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) == "[object Boolean]";
    };
    __g.isNull = function(obj) {
        return obj === null;
    };
    __g.isUndefined = function(obj) {
        return obj === void 0;
    };
    __g.has = function(obj, key) {
        return hasOwnProperty.call(obj, key);
    };
    __g.identity = function(value) {
        return value;
    };
    __g.times = function(n, iterator, context) {
        for (var i = 0; i < n; i++) iterator.call(context, i);
    };
    __g.random = function(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + (0 | Math.random() * (max - min + 1));
    };

    var entityMap = { escape: { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "/": "&#x2F;" } };
    entityMap.unescape = __g.invert(entityMap.escape);
    var entityRegexes = {
        escape: new RegExp("[" + __g.keys(entityMap.escape).join("") + "]", "g"),
        unescape: new RegExp("(" + __g.keys(entityMap.unescape).join("|") + ")", "g")
    };

    __g.each([ "escape", "unescape" ], function(method) {
        __g[method] = function(string) {
            if (string == null) return "";
            return ("" + string).replace(entityRegexes[method], function(match) {
                return entityMap[method][match];
            });
        };
    });
    __g.result = function(object, property) {
        if (object == null) return null;
        var value = object[property];
        return __g.isFunction(value) ? value.call(object) : value;
    };
    __g.mixin = function(obj) {
        each(__g.functions(obj), function(name) {
            var func = __g[name] = obj[name];
            __g.prototype[name] = function() {
                var args = [ this._wrapped ];
                push.apply(args, arguments);
                return result.call(this, func.apply(__g, args));
            };
        });
    };
    var idCounter = 0;
    __g.uniqueId = function(prefix) {
        var id = idCounter++;
        return prefix ? prefix + id : id;
    };

    __g.chain = function(obj) {
        return __g(obj).chain();
    };

    var result = function(obj) {
        return this._chain ? __g(obj).chain() : obj;
    };

    function init(native) {

      var __char={W:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",w:"abcdefghijklmnopqrstuvwxyz",n:"0123456789"};
      __g.randstr = function(a,b){for(var a=a||"",b=(b||8)-a.length,c=__char.w,d=0;d<b;d++)a+=c.charAt(Math.floor(Math.random()*c.length));return a+__g.random(10,99)};

      if(native){
        __g.mixin(require('./mx.strings'));
        __g.mixin(require('./mx.date'));

        __g.until     = function until(test, iterator, cb) { if(test()) return cb(); iterator(function(err) { if (err) return cb(err); until(test, iterator, cb); }); };
        __g.serial    = function(func,cb){function e(func,c){func.length?func.shift()(function(f,cb){f?c(f,d):(d.push(cb),e(func,c))}):c(null,d)}var func=func.slice(0),d=[];e(func,cb)};

        __g.parallel  = function(func,cb){var c="object"===typeof func?Object.keys(func).length:func.length,f={},g=!1,d={};c||cb(null,d);for(var b in func)(function(){var i=func[b],h=b;process.nextTick(function(){i(function(func,b){func&&(f[h]=func,g=!0);b&&(d[h]=b);c--;0==c&&cb(g?f:null,d)})})})()};
        
        
        
        __g.serials   = function(arr, ite, clb){ if(!arr.length) return clb(); var fin = 0; var rst = function(){ ite(arr[fin], function(err){ if(err){ clb(err); clb = function(){}; } else { fin++; if(fin == arr.length) clb(); else rst(); } }); }; rst(); };
        __g.arg       = function(rgmt,sl){!sl&&(sl=0);for(var b=sl,d=(rgmt||[]).length,e=Array(d-sl);b<d;b++)e[b-sl]=rgmt[b];return e};
        __g.args      = function(arg,sht){ var rst=__g.arg(arg), clb; sht&&!rst[0] ? rst.shift() : __define(rst,"first",{value:rst[0]}); clb=rst[rst.length-1]||rst[rst.length]; "function"===typeof clb&&(__define(rst,"callback",{value:clb}),__define(rst,"next",{value:clb}),__define(rst,"cb",{value:clb}),rst.pop());rst.length&&__define(rst,"last",{value:rst[rst.length-1]});return rst};
        __g.merging   = function(obj, rif, cln, ign) { if (!obj || !rif) return null; ign = ign || []; var obj = cln ? __g.clone(obj) : obj, k; for (k in rif) !__g.include(ign, k) && (obj[k] = rif[k]); return obj; };
        __g.uuid      = function(){for(var a=[],b=0;36>b;b++)a[b]=Math.floor(16*Math.random());a[14]=4;a[19]=a[19]&3|8;for(b=0;36>b;b++)a[b]="0123456789ABCDEF"; [a[b]];a[8]=a[13]=a[18]=a[23]="-";return a.join("")};
        __g.suction   = function (obj, sip, ign, hol, ovr) { ign = ign || []; !Array.isArray(ign) && (ign = [ign]); !Array.isArray(hol) && (hol = [hol]); Object.keys(sip).forEach(function (k) { if (0 > ign.indexOf(k)) { var nk = hol && (0 < hol.indexOf(k) || hol[1] === "*") ? hol[0] + k : k; if (obj.hasOwnProperty(k)) { ovr && (obj[nk] = sip[k]) } else { obj[nk] = sip[k] } } }) };
      }
      __g.mixin(__g);

      each([ "pop", "push", "reverse", "shift", "sort", "splice", "unshift" ], function(name) {
          var method = __Array[name];
          __g.prototype[name] = function() {
              var obj = this._wrapped;
              method.apply(obj, arguments);
              if ((name == "shift" || name == "splice") && obj.length === 0) delete obj[0];
              return result.call(this, obj);
          };
      });
      each([ "concat", "join", "slice" ], function(name) {
          var method = __Array[name];
          __g.prototype[name] = function() {
              return result.call(this, method.apply(this._wrapped, arguments));
          };
      });
      __g.shortc = function(str){ str = str[0]+str.slice(1).replace(/[aeiouy]/ig,""); return str.slice(0,5); }

      __g.extend(__g.prototype, {
          chain: function() {
              this._chain = true;
              return this;
          },
          value: function() {
              return this._wrapped;
          }
      });

      if(!native) return {}
      ;//[] :____________________________________
      __g.suction(__g, require("../modules/natives"));

      module.paths.unshift(__g.resolve(__dirname, "../modules"));

      __g.mixin(require('_engines/dtml'));



      __g.module  = function(nm){ return require(nm)}
      __g.modules = function(mod, ref){
        var rst = {module:__g.module};
        __g.each(mod.split(" "), function(v){ this[v] = __g.module(v) }, rst);

        return ref ? __g.gc(rst) : rst;
      }
      __g.patches = function(mods){
        var _patches = require("patches");
        __g.each(mods, function(v,k){ if(_patches.hasOwnProperty(k)) { _patches[k](v); } }, mods);
        return mods;
      }
      __g.gd = function(depth){
        depth = depth || 0;
        if(depth==="native"){
          return __g.merging(new __g(), require("../pac/native"), true, ["graceful"]);
        }else if(depth===0){
          var _ins = __g.merging(this, require("../pac/all"), true, ["graceful"]), gc =__g.gc(_ins);
          delete gc.edge;
          return gc;
        }
      }
    }

  __e ="object" == typeof exports && exports && ("object"==typeof global && global && global === global.global && (root=global), exports);
  init(__e);

  __instance = __g, __name = "edge", __nms = "edge", __precedent = root[__nms];
  __instance.noConflict = function() { root[__nms] = __precedent; return this; };

  "function"==typeof define && "object"==typeof define.amd && define.amd ? (root[__name]=__instance,define(function(){return __instance})):__e?"object"==typeof module&&module&&module.exports === __e ? (module.exports=__instance)[__name]=__instance : __e[__name] = __instance
  :root[__name] = __instance;
}).call(this);


/*
var _acqs = [];
var rxBase = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?([\\\/])?([\s\S]*?)$/;
var rxTail = /^([\s\S]+[\\\/](?!$)|[\\\/])?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/\\]*)?)$/;
var rxPath = /^(\/?)([\s\S]+\/(?!$)|\/)?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/]*)?)$/;
__g.disjoin = function(f) { var rst = {}, ret; if(__g.sep === "\\"){ ret = [], ret[0] = rxBase.exec(f), rst.device = (ret[0][1] || '') + (ret[0][2] || ''), tail = ret[0][3] || '', ret[1] = rxTail.exec(tail), rst.dir = ret[1][1] || '', rst.basename = ret[1][2] || '', rst.ext = ret[1][3] || '', rst.name = rst.basename.replace(rst.ext,"") }else{ rst = rxPath.exec(f); return {device:rst[1] || '', dir:rst[2] || '', basename:rst[3] || '', ext:rst[4] || ''}; } return rst; };

__g.traverse    = require("./traverse");
__g.buffers     = require("./buffers");
__g.catena      = require("./catena");
__g.binary      = require("./binary");
__g.lazer       = require("./lazer");
__g.seq         = require("./seq");
node D:\.Roaming\node\node_modules\UglifyJS2\bin\uglifyjs2 -b --indent-level 2 -m -c --sequences=false edge.js

node D:\.Roaming\node\node_modules\UglifyJS2\bin\uglifyjs2 -b --indent-level 2 -m -c --sequences=false edge.js

__g.templateSettings = {
evaluate: /<%([\s\S]+?)%>/g,
interpolate: /<%=([\s\S]+?)%>/g,
escape: /<%-([\s\S]+?)%>/g
};
var noMatch = /(.)^/;
var escapes = { "'": "'", "\\": "\\", "\r": "r", "\n": "n", "\t": "t", "\u2028": "u2028", "\u2029": "u2029" };
var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
__g.template = function(text, data, settings) {
settings = __g.defaults({}, settings, __g.templateSettings);
var matcher = new RegExp([ (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source ].join("|") + "|$", "g");
var index = 0;
var source = "__p+='";
text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
  source += text.slice(index, offset).replace(escaper, function(match) {
      return "\\" + escapes[match];
  });
  source += escape ? "'+\n((__t=(" + escape + "))==null?'':__g.escape(__t))+\n'" : interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" : evaluate ? "';\n" + evaluate + "\n__p+='" : "";
  index = offset + match.length;
});
source += "';\n";
if (!settings.variable) source = "with(obj||{}){\n" + source + "}\n";
source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
try {
  var render = new Function(settings.variable || "obj", "__g", source);
} catch (e) {
  e.source = source;
  throw e;
}
if (data) return render(data, __g);
var template = function(data) {
  return render.call(this, data, __g);
};
template.source = "function(" + (settings.variable || "obj") + "){\n" + source + "}";
return template;
};
*/


var $g = require("edge"), $ = require("../domino"), readFile = require("fs").readFileSync;

var re_hex            = /&#x[\da-f]+;?/gi
  , re_strictHex      = /&#x[\da-f]+;/gi
  , re_charCode       = /&#\d+;?/g
  , re_strictCharCode = /&#\d+;/g
  , re_notUTF8        = /[\u0000-\u001f\u007f-\uffff]/g
  , fromCharCode      = String.fromCharCode
  , num_func          = function(num) { return fromCharCode(parseInt(num.substr(2), 10)); }
  , hex_func          = function(hex) { return fromCharCode(parseInt(hex.substr(3), 16)); }
  , strictNum_func    = function(num) { return fromCharCode(num.slice(2, -1)); }
  , strictHex_func    = function(num) { return fromCharCode(parseInt(num.slice(3, -1), 16)); }
  , charCode_func     = function(c) { return "&#" + c.charCodeAt(0) + ";"; }
  , preserve;

var class2type = {}
  , types     = "Boolean Number String Function Array Date Regex Object"
  , modes     = [ "XML", "HTML4", "HTML5" ]
  , rboolean  = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i
  , toString  = Object.prototype.toString
  , push      = Array.prototype.push
  , indexOf   = Array.prototype.indexOf
  , isArray   = Array.isArray;

var fetch = function(filename, inherits) {
    var obj = JSON.parse(readFile(__dirname + "/entities/" + filename + ".json", "utf8"));
    if (inherits) for (var name in inherits) obj[name] = inherits[name];
    var re = Object.keys(obj).sort().join("|").replace(/(\w+)\|\1;/g, "$1;?");
    return {
        func: function(name) {
            return obj[name.substr(1)];
        },
        re: new RegExp("&(?:" + re + ")", "g"),
        obj: obj
    };
};

var getReverse = function(obj) {
    var reverse = Object.keys(obj).reduce(function(reverse, name) {
        reverse[obj[name]] = name;
        return reverse;
    }, {});
    return {
        func: function(name) {
            return "&" + reverse[name];
        },
        re: new RegExp("\\" + Object.keys(reverse).sort().join("|\\"), "g")
    };
};

var entities = {
    decode: function(data, level) {
        if (!modes[level]) level = 0;
        return module.exports["decode" + modes[level]](data);
    },
    encode: function(data, level) {
        if (!modes[level]) level = 0;
        return module.exports["encode" + modes[level]](data);
    }
};

$g.each(modes, function(name) {
    var obj = fetch(name.toLowerCase(), preserve), regex = obj.re, func = obj.func;
    preserve = obj.obj;
    if (!module.exports["decode" + name]) {
        module.exports["decode" + name] = function(data) {
            return data.replace(regex, func).replace(re_hex, hex_func).replace(re_charCode, num_func);
        };
    }
    var reverse = getReverse(obj.obj), reverse_re = reverse.re, reverse_func = reverse.func;
    module.exports["encode" + name] = function(data) {
      return data.replace(reverse_re, reverse_func).replace(re_notUTF8, charCode_func);
    };
});

$g.each(types.split(" "), function(name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});

var tags = {
    tag: true,
    script: true,
    style: true
};

var encode = exports.encode = function(str) {
    return entities.encode(str, 0);
};

var decode = exports.decode = function(str) {
    return entities.decode(str, 2);
};

var isTag = exports.isTag = function(type) {
    if (type.type) type = type.type;
    return tags[type] || false;
};

var type = exports.type = function(obj) {
    if (obj === null) return String(obj); else return class2type[toString.call(obj)] || "object";
};

var merge = exports.merge = function(first, second) {
    var i = first.length, j = 0;
    if (typeof second.length === "number") {
        for (var l = second.length; j < l; j++) {
            first[i++] = second[j];
        }
    } else {
        while (second[j] !== undefined) {
            first[i++] = second[j++];
        }
    }
    first.length = i;
    return first;
};

var makeArray = exports.makeArray = function(array, results) {
    var ret = results || [], type = $.type(array);
    if (!array) return ret;
    if (array.length == null || type === "string" || type === "function" || type === "regexp") {
        push.call(ret, array);
    } else {
        merge(ret, array);
    }
    return ret;
};

var inArray = exports.inArray = function(elem, array, i) {
    var len;
    if (array) {
        if (indexOf) {
            return indexOf.call(array, elem, i);
        }
        len = array.length;
        i = i ? i < 0 ? Math.max(0, len + i) : i : 0;
        for (;i < len; i++) {
            if (i in array && array[i] === elem) {
                return i;
            }
        }
    }
    return -1;
};

var each = exports.each = function(object, callback, args) {
    var name, i = 0, length = object.length, isObj = length === undefined || $g.isFunction(object);
    if (args) {
        if (isObj) {
            for (name in object) {
                if (callback.apply(object[name], args) === false) {
                    break;
                }
            }
        } else {
            for (;i < length; ) {
                if (callback.apply(object[i++], args) === false) {
                    break;
                }
            }
        }
    } else {
        if (isObj) {
            for (name in object) {
                if (callback.call(object[name], name, object[name]) === false) {
                    break;
                }
            }
        } else {
            for (;i < length; ) {
                if (callback.call(object[i], i, object[i++]) === false) {
                    break;
                }
            }
        }
    }
    return object;
};

var access = exports.access = function(elems, key, value, exec, fn, pass) {
    var length = elems.length;
    if (typeof key === "object") {
        for (var k in key) {
            access(elems, k, key[k], exec, fn, value);
        }
        return elems;
    }
    if (value !== undefined) {
        exec = !pass && exec && $g.isFunction(value);
        for (var i = 0; i < length; i++) {
            fn(elems[i], key, exec ? value.call(elems[i], i, fn(elems[i], key)) : value, pass);
        }
        return elems;
    }
    return length ? fn(elems[0], key) : undefined;
};

var attr = exports.attr = function(elem, name, value, pass) {
    var type = elem.type;
    if (!elem || !isTag(elem)) return undefined;
    if (!elem.attribs) {
        elem.attribs = {};
    }
    if (!name) {
        for (var a in elem.attribs) {
            elem.attribs[a] = decode(elem.attribs[a]);
        }
        return elem.attribs;
    }
    if (value !== undefined) {
        if (value === null) {
            $.removeAttr(elem, name);
        } else {
            elem.attribs[name] = "" + encode(value);
        }
    } else if (elem.attribs[name]) {
        return decode(elem.attribs[name]);
    }
};

var removeAttr = exports.removeAttr = function(elem, name) {
    if (!isTag(elem.type) || !elem.attribs || !elem.attribs[name]) return;
    if (rboolean.test(elem.attribs[name])) elem.attribs[name] = false; else delete elem.attribs[name];
};

var text = exports.text = function(elems) {
    if (!elems) return "";
    var ret = "", len = elems.length, elem;
    for (var i = 0; i < len; i++) {
        elem = elems[i];
        if (elem.type === "text") ret += decode(elem.data); else if (elem.children && elem.type !== "comment") {
            ret += text(elem.children);
        }
    }
    return ret;
};

var load = exports.load = function(html, options) {
    options = options || {};
    options = $g.defaults(options, $.fn.options);
    var root = $.parse(html, options);
    function fn(selector, context, r) {
        if (r) root = $.parse(r, options);
        return $(selector, context, root);
    }
    $.extend({
        _root: root
    });
    return $g(fn).extend($);
};

var html = exports.html = function(dom) {
    if (dom) {
        dom = type(dom) === "string" ? this(dom) : dom;
        return $.render(dom);
    } else if (this._root && this._root.children) {
        return $.render(this._root.children);
    } else {
        return "";
    }
};

var tidy = exports.tidy = function(dom) {
    if (dom !== undefined) {
        return $.render(dom, {
            tidy: true
        });
    } else if (this._root && this._root.children) {
        return $.render(this._root.children, {
            tidy: true
        });
    } else {
        return "";
    }
};

var dom = exports.dom = function(dom) {
    if (dom && dom.type) {
        return dom;
    } else if (this._root && this._root.children) {
        return this._root.children;
    } else {
        return "";
    }
};

var root = exports.root = function() {
    return $(this._root);
};

module.exports = $.extend(exports);
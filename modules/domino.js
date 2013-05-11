var $u      = require("./_domino/util");
var select  = require("./_domino/selector");

var domino = function() {
    var domino = function(selector, context, root) {
        return new domino.fn.init(selector, context, root);
    };
    var quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;
    domino.fn = domino.prototype = {
        domino: "[domino object]",
        constructor: domino,
        init: function(selector, context, root) {
            if (!selector) return this;
            if (root) {
                domino.extend({
                    _root: root
                });
                if (typeof context === "string") selector = context + " " + selector;
                context = root;
            }
            if (typeof selector === "string") {
                var match = null;
                if (/^<.+>$/.test(selector)) {
                    match = [ null, selector, null ];
                } else {
                    match = quickExpr.exec(selector);
                }
                if (match && (match[1] || !context)) {
                    if (match[1]) {
                        root = domino.parse(selector);
                        return domino.merge(this, root.children);
                    } else if (context) {
                        try {
                            var elems = select(selector, context);
                            this.selector = selector;
                            return domino.merge(this, elems);
                        } catch (e) {
                            return [];
                        }
                    }
                }
                if (!context || context.domino) {
                    return this.constructor(context || root).find(selector);
                } else {
                    if (typeof context === "string") {
                        context = domino.parse(context);
                    }
                    return this.constructor(context).find(selector);
                }
            }
            return domino.makeArray(selector, this);
        },
        options: {
            ignoreWhitespace: false,
            xmlMode: false,
            lowerCaseTags: false
        },
        selector: "",
        sort: [].splice,
        length: 0
    };
    domino.fn.init.prototype = domino.fn;
    domino.extend = domino.fn.extend = function(obj) {
        return $u.extend(this, obj);
    };
    return domino;
}();

module.exports = domino;

$u.each("core methods parse render attributes traverse manipulation".split(" "), function(name) {
    require("./_domino/" + name + ".js");
});

/*
console.log(require("colors"));
console.log(require("request"));
console.log(inspect(process.memoryUsage()));
//rss: 27357184, heapTotal: 17570304, heapUsed: 10583568
//rss: 27340800, heapTotal: 17570304, heapUsed: 10597960
*/

/*
console.log($gd.module("colors"));
console.log($gd.module("request"));
console.log(inspect(process.memoryUsage()));
// rss: 26656768, heapTotal: 17570304, heapUsed: 9863856
// rss: 26632192, heapTotal: 17570304, heapUsed: 9863312
*/
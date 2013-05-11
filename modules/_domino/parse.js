var htmlparser  = require("./htmlparser")
  , $           = require("../domino")
  , $u          = require("./util")
  , isArray     = Array.isArray
;//_________________________________

var parse = exports.parse = function(content, options) {
    var dom = eval(content, options);
    var root = {
        type: "root",
        name: "root",
        parent: null,
        prev: null,
        next: null,
        children: []
    };
    update(dom, root);
    return root;
};

var eval = exports.parse.eval = function(content, options) {
    options = options || $.fn.options;
    var handler = new htmlparser.DomHandler(options), parser = new htmlparser.Parser(handler, options);
    parser.write(content);
    parser.done();
    return connect(handler.dom);
};

var connect = exports.parse.connect = function(dom, parent) {
    parent = parent || null;
    var prevElem = null;
    if (dom && dom.length) {
        try {
            $u.each(dom, function(elem) {
                if ($.isTag(elem.type) && elem.attribs === undefined) elem.attribs = {};
                elem.parent = parent;
                elem.prev = prevElem;
                elem.next = null;
                if (prevElem) prevElem.next = elem;
                if (elem.children) connect(elem.children, elem); else if ($.isTag(elem.type)) elem.children = [];
                prevElem = elem;
            });
        } catch (err) {
            console.error("[31m%s [0m: [31m[1m%s [0m", "ERR parse.js", err);
        }
    }
    return dom;
};

var update = exports.parse.update = function(arr, parent) {
    arr = isArray(arr) ? arr : [ arr ];
    for (var i = 0; i < arr.length; i++) {
        arr[i].prev = arr[i - 1] || null;
        arr[i].next = arr[i + 1] || null;
        arr[i].parent = parent || null;
    }
    parent.children = arr;
    return parent;
};

module.exports = $.extend(exports);
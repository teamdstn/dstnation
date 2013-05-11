var $u = require("./util"), $ = require("../domino"), updateDOM = $.parse.update, slice = Array.prototype.slice;

var removeChild = function(parent, elem) {
    $.each(parent.children, function(i, child) {
        if (elem === child) parent.children.splice(i, 1);
    });
};

var makeDominoArray = function(elems) {
    return $u.reduce(elems, function(dom, elem) {
        return dom.concat(elem.domino ? elem.toArray() : $.parse.eval(elem));
    }, []);
};

var append = exports.append = function() {
    var elems = slice.call(arguments), dom = makeDominoArray(elems);
    this.each(function() {
        if ($u.isFunction(elems[0])) {
            return this;
        } else {
            if (!this.children) this.children = [];
            this.children = this.children.concat(dom);
            updateDOM(this.children, this);
        }
    });
    return this;
};

var prepend = exports.prepend = function() {
    var elems = slice.call(arguments), dom = makeDominoArray(elems);
    this.each(function() {
        if ($u.isFunction(elems[0])) {
            return this;
        } else {
            if (!this.children) this.children = [];
            this.children = dom.concat(this.children);
            updateDOM(this.children, this);
        }
    });
    return this;
};

var after = exports.after = function() {
    var elems = slice.call(arguments), dom = makeDominoArray(elems);
    this.each(function() {
        var siblings = this.parent.children, index = siblings.indexOf(this);
        if (!~index) return;
        siblings.splice.apply(siblings, [ ++index, 0 ].concat(dom));
        updateDOM(siblings, this.parent);
        this.parent.children = siblings;
    });
    return this;
};

var before = exports.before = function() {
    var elems = slice.call(arguments), dom = makeDominoArray(elems);
    this.each(function() {
        var siblings = this.parent.children, index = siblings.indexOf(this);
        if (!~index) return;
        siblings.splice.apply(siblings, [ index, 0 ].concat(dom));
        updateDOM(siblings, this.parent);
        this.parent.children = siblings;
    });
    return this;
};

var remove = exports.remove = function(selector) {
    var elems = this;
    if (selector) elems = elems.find(selector);
    elems.each(function() {
        var siblings = this.parent.children, index = siblings.indexOf(this);
        if (!~index) return;
        siblings.splice(index, 1);
        updateDOM(siblings, this.parent);
        this.parent.children = siblings;
    });
    return this;
};

var replaceWith = exports.replaceWith = function(content) {
    content = content.domino ? content.toArray() : $.parse.eval(content);
    this.each(function() {
        var siblings = this.parent.children, index = siblings.indexOf(this);
        if (!~index) return;
        siblings.splice.apply(siblings, [ index, 1 ].concat(content));
        updateDOM(siblings, this.parent);
        this.parent.children = siblings;
    });
    return this;
};

var empty = exports.empty = function() {
    this.each(function() {
        this.children = [];
    });
    return this;
};

var html = exports.html = function(content) {
    if (content === undefined) {
        if (!this[0] || !this[0].children) return null;
        return $.html(this[0].children);
    }
    content = content.domino ? content.toArray() : $.parse.eval(content);
    this.each(function() {
        this.children = content;
        updateDOM(this.children, this);
    });
    return this;
};

var tidy = exports.tidy = function() {
    return $.tidy(this[0].children);
};

var text = exports.text = function(str) {
    if (!str || typeof str === "object") {
        return $.text(this);
    } else if ($u.isFunction(str)) {
        return this.each(function(i) {
            var self = $(this);
            return self.text(str.call(this, i, self.text()));
        });
    }
    var elem = {
        data: $.encode(str),
        type: "text",
        parent: null,
        prev: null,
        next: null,
        children: []
    };
    this.each(function() {
        this.children = elem;
        updateDOM(this.children, this);
    });
    return this;
};

var clone = exports.clone = function() {
    return $($.html(this));
};

module.exports = $.fn.extend(exports);
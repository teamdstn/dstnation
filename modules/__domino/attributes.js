var $u = require("./util"), $ = require("../domino"), rclass = /[\n\t\r]/g, rspace = /\s+/;

var attr = exports.attr = function(name, value) {
    return $.access(this, name, value, true, $.attr);
};

var removeAttr = exports.removeAttr = function(name) {
    this.each(function() {
        $.removeAttr(this, name);
    });
    return this;
};

var hasClass = exports.hasClass = function(className) {
    return $u.any(this, function(elem) {
        var attrs = elem.attribs;
        return attrs && $u.contains((attrs["class"] || "").split(/\s+/), className);
    });
};

var addClass = exports.addClass = function(value) {
    if ($u.isFunction(value)) {
        this.each(function(i) {
            var $this = $(this), className = $this.attr("class") || "";
            $this.addClass(value.call(this, i, className));
        });
    }
    if (!value || !$u.isString(value)) return this;
    var classNames = value.split(rspace), numElements = this.length, numClasses, setClass, $elem;
    for (var i = 0; i < numElements; i++) {
        $elem = $(this[i]);
        if (!$.isTag(this[i])) continue;
        if (!$elem.attr("class")) {
            $elem.attr("class", classNames.join(" ").trim());
        } else {
            setClass = " " + $elem.attr("class") + " ";
            numClasses = classNames.length;
            for (var j = 0; j < numClasses; j++) {
                if (!~setClass.indexOf(" " + classNames[j] + " ")) setClass += classNames[j] + " ";
            }
            $elem.attr("class", setClass.trim());
        }
    }
    return this;
};

var removeClass = exports.removeClass = function(value) {
    var split = function(className) {
        return !className ? [] : className.trim().split(/\s+/);
    };
    if ($u.isFunction(value)) {
        return this.each(function(idx) {
            $this.removeClass(value.call(this, idx, $(this).attr("class") || ""));
        });
    }
    return this.each(function() {
        if ($.isTag(this)) {
            this.attribs["class"] = !value ? "" : $u.reject(split(this.attribs["class"]), function(name) {
                return $u.contains(split(value), name);
            }).join(" ");
        }
    });
};

module.exports = $.fn.extend(exports);
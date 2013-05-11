"use strict";

var isArray = Array.isArray;

function isElement(elem) {
    return elem.type === "tag" || elem.type === "style" || elem.type === "script";
}

function getChildren(elem) {
    return elem.children;
}

function getParent(elem) {
    return elem.parent;
}

function getAttributeValue(elem, name) {
    return elem.attribs[name];
}

function hasAttrib(elem, name) {
    return elem.attribs && name in elem.attribs;
}

function getName(elem) {
    return elem.name;
}

function getText(elem) {
    var text = "", childs = getChildren(elem);
    if (!childs) return text;
    for (var i = 0, j = childs.length; i < j; i++) {
        if (isElement(childs[i])) text += getText(childs[i]); else text += childs[i].data;
    }
    return text;
}

var re_name = /^(?:\\.|[\w\-\u00c0-\uFFFF])+/, re_cleanSelector = /\s*([>~+])\s*/g, re_nthElement = /^([+\-]?\d*n)?\s*([+\-])?\s*(\d)?$/, re_escapedCss = /\\(\d{6}|.)/g, re_attr = /^\s*((?:\\.|[\w\u00c0-\uFFFF\-:])+)\s*(?:(\S?)=\s*(?:(['"])(.*?)\3|(#?(?:\\.|[\w\u00c0-\uFFFF\-])*)|)|)\s*(i)?\]/;

var actionTypes = {
    __proto__: null,
    undefined: "exists",
    "": "equals",
    "~": "element",
    "^": "start",
    $: "end",
    "*": "any",
    "!": "not",
    "|": "hyphen"
};

var simpleSelectors = {
    __proto__: null,
    ">": "child",
    "~": "sibling",
    "+": "adjacent",
    "*": "universal"
};

var attribSelectors = {
    __proto__: null,
    "#": [ "id", "equals" ],
    ".": [ "class", "element" ]
};

function unescapeCSS(str) {
    return str.replace(re_escapedCss, function(m, s) {
        if (isNaN(s)) return s;
        return String.fromCharCode(parseInt(s, 10));
    });
}

function getClosingPos(selector) {
    for (var pos = 1, counter = 1, len = selector.length; counter > 0 && pos < len; pos++) {
        if (selector.charAt(pos) === "(") counter++; else if (selector.charAt(pos) === ")") counter--;
    }
    return pos;
}

var filters = {
    not: function(next, select) {
        var func = parse(select);
        if (func === falseFunc) {
            if (next === rootFunc) return trueFunc; else return next;
        }
        if (func === trueFunc) return falseFunc;
        if (func === rootFunc) return falseFunc;
        return function(elem) {
            if (!func(elem)) return next(elem);
        };
    },
    contains: function(next, text) {
        if ((text.charAt(0) === '"' || text.charAt(0) === "'") && text.charAt(0) === text.substr(-1)) {
            text = text.slice(1, -1);
        }
        return function(elem) {
            if (getText(elem).indexOf(text) !== -1) return next(elem);
        };
    },
    has: function(next, select) {
        var func = parse(select);
        if (func === rootFunc || func === trueFunc) return next;
        if (func === falseFunc) return falseFunc;
        var proc = function(elem) {
            var children = getChildren(elem);
            if (!children) return;
            for (var i = 0, j = children.length; i < j; i++) {
                if (!isElement(children[i])) continue;
                if (func(children[i])) return true;
                if (proc(children[i])) return true;
            }
        };
        return function proc(elem) {
            if (proc(elem)) return next(elem);
        };
    },
    root: function(next) {
        return function(elem) {
            if (!getParent(elem)) return next(elem);
        };
    },
    empty: function(next) {
        return function(elem) {
            var children = getChildren(elem);
            if (!children || children.length === 0) return next(elem);
        };
    },
    parent: function(next) {
        return function(elem) {
            var children = getChildren(elem);
            if (children && children.length !== 0) return next(elem);
        };
    },
    "first-child": function(next) {
        return function(elem) {
            if (getFirstElement(getSiblings(elem)) === elem) return next(elem);
        };
    },
    "last-child": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) return next(elem);
                if (isElement(siblings[i])) return;
            }
        };
    },
    "first-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var i = 0, j = siblings.length; i < j; i++) {
                if (siblings[i] === elem) return next(elem);
                if (getName(siblings[i]) === getName(elem)) return;
            }
        };
    },
    "last-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) return next(elem);
                if (getName(siblings[i]) === getName(elem)) return;
            }
        };
    },
    "only-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var i = 0, j = siblings.length; i < j; i++) {
                if (siblings[i] === elem) continue;
                if (getName(siblings[i]) === getName(elem)) return;
            }
            return next(elem);
        };
    },
    "only-child": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            if (siblings.length === 1) return next(elem);
            for (var i = 0, j = siblings.length; i < j; i++) {
                if (isElement(siblings[i]) && siblings[i] !== elem) return;
            }
            return next(elem);
        };
    },
    "nth-child": function(next, rule) {
        var func = getNCheck(rule);
        if (func === falseFunc) return func;
        if (func === trueFunc) {
            if (next === rootFunc) return func; else return next;
        }
        return function(elem) {
            if (func(getIndex(elem))) return next(elem);
        };
    },
    "nth-last-child": function(next, rule) {
        var func = getNCheck(rule);
        if (func === falseFunc) return func;
        if (func === trueFunc) {
            if (next === rootFunc) return func; else return next;
        }
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) {
                    if (func(pos)) return next(elem);
                    return;
                }
                if (isElement(siblings[i])) pos++;
            }
        };
    },
    "nth-of-type": function(next, rule) {
        var func = getNCheck(rule);
        if (func === falseFunc) return func;
        if (func === trueFunc) {
            if (next === rootFunc) return func; else return next;
        }
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var pos = 0, i = 0, j = siblings.length; i < j; i++) {
                if (siblings[i] === elem) {
                    if (func(pos)) return next(elem);
                    return;
                }
                if (getName(siblings[i]) === getName(elem)) pos++;
            }
        };
    },
    "nth-last-of-type": function(next, rule) {
        var func = getNCheck(rule);
        if (func === falseFunc) return func;
        if (func === trueFunc) {
            if (next === rootFunc) return func; else return next;
        }
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) {
                    if (func(pos)) return next(elem);
                    return;
                }
                if (getName(siblings[i]) === getName(elem)) pos++;
            }
        };
    },
    selected: function(next) {
        return function(elem) {
            if (hasAttrib(elem, "selected")) return next(elem);
            if (getName(getParent(elem)) !== "option") return;
            if (getFirstElement(getSiblings(elem)) === elem) return next(elem);
        };
    },
    disabled: function(next) {
        return function(elem) {
            if (hasAttrib(elem, "disabled")) return next(elem);
        };
    },
    enabled: function(next) {
        return function(elem) {
            if (!hasAttrib(elem, "disabled")) return next(elem);
        };
    },
    checked: function(next) {
        return function(elem) {
            if (hasAttrib(elem, "checked")) return next(elem);
        };
    },
    header: function(next) {
        return function(elem) {
            var name = getName(elem);
            if (name === "h1" || name === "h2" || name === "h3" || name === "h4" || name === "h5" || name === "h6") return next(elem);
        };
    },
    button: function(next) {
        return function(elem) {
            if (getName(elem) === "button" || getName(elem) === "input" && hasAttrib(elem, "type") && getAttributeValue(elem, "type") === "button") return next(elem);
        };
    },
    input: function(next) {
        return function(elem) {
            var name = getName(elem);
            if (name === "input" || name === "textarea" || name === "select" || name === "button") return next(elem);
        };
    },
    text: function(next) {
        return function(elem) {
            if (getName(elem) !== "input") return;
            if (!hasAttrib(elem, "type") || getAttributeValue(elem, "type") === "text") return next(elem);
        };
    },
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit")
};

var pseudos = {};

function getSiblings(elem) {
    return getParent(elem) && getChildren(getParent(elem));
}

function getIndex(elem) {
    var siblings = getSiblings(elem);
    if (!siblings) return -1;
    for (var count = 0, i = 0, j = siblings.length; i < j; i++) {
        if (siblings[i] === elem) return count;
        if (isElement(siblings[i])) count++;
    }
    return -1;
}

function getFirstElement(elems) {
    if (!elems) return;
    for (var i = 0, j = elems.length; i < j; i++) {
        if (isElement(elems[i])) return elems[i];
    }
}

var re_nthElement = /^([+\-]?\d*n)?\s*([+\-])?\s*(\d)?$/;

function getNCheck(formula) {
    var a, b;
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
        a = 2;
        b = -1;
    } else if (formula === "odd") {
        a = 2;
        b = 0;
    } else {
        formula = formula.match(re_nthElement);
        if (!formula) {
            throw new SyntaxError("n-th rule couldn't be parsed");
        }
        if (formula[1]) {
            a = parseInt(formula[1], 10);
            if (!a) {
                if (formula[1].charAt(0) === "-") a = -1; else a = 1;
            }
        } else a = 0;
        if (formula[3]) b = parseInt((formula[2] || "") + formula[3], 10) - 1; else b = -1;
    }
    if (b < 0 && a <= 0) return falseFunc;
    if (b < 0 && a === 1) return trueFunc;
    if (a === -1) return function(pos) {
        return pos - b <= 0;
    };
    if (a === 1) return function(pos) {
        return pos - b >= 0;
    };
    if (a === 0) return function(pos) {
        return pos === b;
    };
    if (a > 1) return function(pos) {
        return pos >= 0 && (pos -= b) >= 0 && pos % a === 0;
    };
    a *= -1;
    return function(pos) {
        return pos >= 0 && (pos -= b) >= 0 && pos % a === 0 && pos / a < b;
    };
}

function getAttribFunc(name, value) {
    return function(next) {
        return checkAttrib(next, name, value);
    };
}

function checkAttrib(next, name, value) {
    return function(elem) {
        if (hasAttrib(elem, name) && getAttributeValue(elem, name) === value) {
            return next(elem);
        }
    };
}

function rootFunc() {
    return true;
}

function trueFunc() {
    return true;
}

function falseFunc() {
    return false;
}

var generalRules = {
    __proto__: null,
    tag: function(next, data) {
        var name = data.name;
        return function(elem) {
            if (getName(elem) === name) return next(elem);
        };
    },
    descendant: function(next) {
        return function(elem) {
            while (elem = getParent(elem)) {
                if (next(elem)) return true;
            }
        };
    },
    child: function(next) {
        return function(elem) {
            var parent = getParent(elem);
            if (parent) return next(parent);
        };
    },
    sibling: function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);
            if (!siblings) return;
            for (var i = 0, j = siblings.length; i < j; i++) {
                if (!isElement(siblings[i])) continue;
                if (siblings[i] === elem) return;
                if (next(siblings[i])) return true;
            }
        };
    },
    adjacent: function(next) {
        return function(elem) {
            var siblings = getSiblings(elem), lastElement;
            if (!siblings) return;
            for (var i = 0, j = siblings.length; i < j; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) {
                        if (lastElement) return next(lastElement);
                        return;
                    }
                    lastElement = siblings[i];
                }
            }
        };
    },
    universal: function(next) {
        if (next === rootFunc) return trueFunc;
        return next;
    },
    attribute: function(next, data) {
        if (data.ignoreCase) {
            return noCaseAttributeRules[data.action](next, data.name, data.value, data.ignoreCase);
        } else {
            return attributeRules[data.action](next, data.name, data.value, data.ignoreCase);
        }
    },
    pseudo: function(next, data) {
        var name = data.name, subselect = data.data;
        if (name in filters) return filters[name](next, subselect); else if (name in pseudos) {
            return function(elem) {
                if (pseudos[name](elem, subselect)) return next(elem);
            };
        } else {
            throw new SyntaxError("unmatched pseudo-class: " + name);
        }
    }
};

var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

function escapeRe(str) {
    return str.replace(reChars, "\\$&");
}

function wrapReRule(pre, post) {
    return function(next, name, value, ignoreCase) {
        var regex = new RegExp(pre + escapeRe(value) + post, ignoreCase ? "i" : "");
        return function(elem) {
            if (hasAttrib(elem, name) && regex.test(getAttributeValue(elem, name))) return next(elem);
        };
    };
}

var noCaseAttributeRules = {
    __proto__: null,
    exists: function(next, name) {
        return function(elem) {
            if (hasAttrib(elem, name)) return next(elem);
        };
    },
    element: wrapReRule("(?:^|\\s)", "(?:$|\\s)"),
    equals: wrapReRule("^", "$"),
    hyphen: wrapReRule("^", "(?:$|-)"),
    start: wrapReRule("^", ""),
    end: wrapReRule("", "$"),
    any: wrapReRule("", ""),
    not: wrapReRule("^(?!^", "$)")
};

var attributeRules = {
    __proto__: null,
    equals: checkAttrib,
    exists: noCaseAttributeRules.exists,
    hyphen: noCaseAttributeRules.hyphen,
    element: noCaseAttributeRules.element,
    start: function(next, name, value) {
        var len = value.length;
        return function(elem) {
            if (hasAttrib(elem, name) && getAttributeValue(elem, name).substr(0, len) === value) return next(elem);
        };
    },
    end: function(next, name, value) {
        var len = -value.length;
        return function(elem) {
            if (hasAttrib(elem, name) && getAttributeValue(elem, name).substr(len) === value) return next(elem);
        };
    },
    any: function(next, name, value) {
        return function(elem) {
            if (hasAttrib(elem, name) && getAttributeValue(elem, name).indexOf(value) >= 0) return next(elem);
        };
    },
    not: function(next, name, value) {
        if (value === "") {
            return function(elem) {
                if (hasAttrib(elem, name) && getAttributeValue(elem, name) !== "") return next(elem);
            };
        }
        return function(elem) {
            if (!hasAttrib(elem, name) || getAttributeValue(elem, name) !== value) {
                return next(elem);
            }
        };
    }
};

var procedure = {
    __proto__: null,
    universal: 5,
    tag: 3,
    attribute: 1,
    pseudo: 0,
    descendant: -1,
    child: -1,
    sibling: -1,
    adjacent: -1
};

function sortByProcedure(arr) {
    var parts = [], last = 0, end = false;
    for (var i = 0, j = arr.length - 1; i <= j; i++) {
        if (procedure[arr[i].type] === -1 || (end = i === j)) {
            if (end) i++;
            parts = parts.concat(arr.slice(last, i).sort(function(a, b) {
                return procedure[a.type] - procedure[b.type];
            }));
            if (!end) last = parts.push(arr[i]);
        }
    }
    return parts;
}

var cssParse = function cssParse(selector) {
    selector = (selector + "").trim().replace(re_cleanSelector, "$1");
    var subselects = [], tokens = [], data, firstChar, name;
    function getName() {
        var sub = selector.match(re_name)[0];
        selector = selector.substr(sub.length);
        return unescapeCSS(sub);
    }
    while (selector !== "") {
        if (re_name.test(selector)) {
            tokens.push({
                type: "tag",
                name: getName().toLowerCase()
            });
        } else if (/^\s/.test(selector)) {
            tokens.push({
                type: "descendant"
            });
            selector = selector.trimLeft();
        } else {
            firstChar = selector.charAt(0);
            selector = selector.substr(1);
            if (firstChar in simpleSelectors) {
                tokens.push({
                    type: simpleSelectors[firstChar]
                });
            } else if (firstChar in attribSelectors) {
                tokens.push({
                    type: "attribute",
                    name: attribSelectors[firstChar][0],
                    action: attribSelectors[firstChar][1],
                    value: getName(),
                    ignoreCase: false
                });
            } else if (firstChar === "[") {
                data = selector.match(re_attr);
                selector = selector.substr(data[0].length);
                tokens.push({
                    type: "attribute",
                    name: unescapeCSS(data[1]),
                    action: actionTypes[data[2]],
                    value: unescapeCSS(data[4] || data[5] || ""),
                    ignoreCase: !!data[6]
                });
            } else if (firstChar === ":") {
                name = getName();
                data = "";
                if (selector.charAt(0) === "(") {
                    var pos = getClosingPos(selector);
                    data = selector.substr(1, pos - 2);
                    selector = selector.substr(pos);
                }
                tokens.push({
                    type: "pseudo",
                    name: name,
                    data: data
                });
            } else if (firstChar === ",") {
                subselects.push(tokens);
                tokens = [];
            } else {
                throw new Error("Unmatched selector:" + firstChar + selector);
            }
        }
    }
    subselects.push(tokens);
    return subselects;
};

function parse(selector) {
    var functions = cssParse(selector).map(function(arr) {
        var func = rootFunc;
        arr = sortByProcedure(arr);
        for (var i = 0, j = arr.length; i < j; i++) {
            func = generalRules[arr[i].type](func, arr[i]);
            if (func === falseFunc) return func;
        }
        return func;
    }).filter(function(func) {
        return func !== rootFunc && func !== falseFunc;
    });
    var num = functions.length;
    if (num === 0) return falseFunc;
    if (num === 1) return functions[0];
    if (functions.indexOf(trueFunc) >= 0) return trueFunc;
    return function(elem) {
        for (var i = 0; i < num; i++) {
            if (functions[i](elem)) return true;
        }
        return false;
    };
}

function iterate(query, elems) {
    var result = [];
    for (var i = 0, j = elems.length; i < j; i++) {
        if (!isElement(elems[i])) continue;
        if (query(elems[i])) result.push(elems[i]);
        if (getChildren(elems[i])) result = result.concat(iterate(query, getChildren(elems[i])));
    }
    return result;
}

var normalize = function(dom) {
    dom = dom.domino ? dom.toArray() : dom;
    !isArray(dom) && [ dom ];
    for (var i = 0, len = dom.length, rst = [], elem; i < len; i++) {
        elem = dom[i];
        if (elem.type === "root") {
            rst = rst.concat(elem.children || []);
        } else {
            rst.push(elem);
        }
    }
    return rst;
};

var cssSelect = function(query, elems) {
    if (typeof query !== "function") query = parse(query);
    if (arguments.length === 1) return query;
    return cssSelect.iterate(query, elems);
};

cssSelect.parse = parse;

cssSelect.filters = filters;

cssSelect.pseudos = pseudos;

cssSelect.iterate = function(query, elems) {
    if (typeof query !== "function") query = parse(query);
    if (query === falseFunc) return [];
    if (!Array.isArray(elems)) elems = getChildren(elems);
    return iterate(query, elems);
};

cssSelect.is = function(elem, query) {
    if (typeof query !== "function") query = parse(query);
    return query(elem);
};

exports = module.exports = function(query, dom) {
    dom = normalize(dom);
    return cssSelect.iterate(query, dom);
};

exports.normalize = normalize;
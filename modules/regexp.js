var XRegExp = function (undefined) {
"use strict";

  var REGEX_DATA = "xregexp";
  var self, features = {
    astral: false,
    natives: false
  }
  , nativ = {
    exec    : RegExp.prototype.exec,
    test    : RegExp.prototype.test,
    match   : String.prototype.match,
    replace : String.prototype.replace,
    split   : String.prototype.split
  }
  , fixed = {}
  , cache = {}
  , patternCache  = {}
  , tokens        = []
  , defaultScope  = "default"
  , classScope    = "class"
  , nativeTokens  = {
    "default": /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
    "class": /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|[\s\S]/
  }
  , replacementToken  = /\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g
  , correctExecNpcg   = nativ.exec.call(/()??/, "")[1] === undefined
  , hasNativeY        = RegExp.prototype.sticky !== undefined
  , registeredFlags   = {
    g: true,
    i: true,
    m: true,
    y: hasNativeY
  }
  , toString = {}.toString,
  , add
;//==================================================

  function augment(regex, captureNames, addProto) {
    var p;
    if (addProto) {
      if (regex.__proto__) {
        regex.__proto__ = self.prototype;
      } else {
        for (p in self.prototype) {
          regex[p] = self.prototype[p];
        }
      }
    }
    regex[REGEX_DATA] = {
      captureNames: captureNames
    };
    return regex;
  }

  function clipDuplicates(str) {
    return nativ.replace.call(str, / ([\s\S])( ? = [\s\S] * \1) / g, "");
  }

  function copy(regex, options) {
    if (!self.isRegExp(regex)) {
      throw new TypeError("Type RegExp expected");
    }
    var flags = nativ.exec.call(/\/([a-z]*)$/i, String(regex))[1];
    options = options || {};
    if (options.add) {
      flags = clipDuplicates(flags + options.add);
    }
    if (options.remove) {
      flags = nativ.replace.call(flags, new RegExp("[" + options.remove + "]+", "g"), "");
    }
    regex = augment(new RegExp(regex.source, flags), hasNamedCapture(regex) ? regex[REGEX_DATA].captureNames.slice(0) : null, options.addProto);
    return regex;
  }

  function getBaseProps() {
    return {
      captureNames: null
    };
  }

  function hasNamedCapture(regex) {
    return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
  }

  function indexOf(array, value) {
    if (Array.prototype.indexOf) {
      return array.indexOf(value);
    }
    var len = array.length,
      i;
    for (i = 0; i < len; ++i) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }

  function isType(value, type) {
    return toString.call(value) === "[object " + type + "]";
  }

  function isQuantifierNext(pattern, pos, flags) {
    return nativ.test.call(flags.indexOf("x") > -1 ? /^(?:\s+|#.*|\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/ : /^(?:\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/, pattern.slice(pos));
  }

  function prepareFlags(pattern, flags) {
    var i;
    if (clipDuplicates(flags) !== flags) {
      throw new SyntaxError("Invalid duplicate regex flag " + flags);
    }
    pattern = nativ.replace.call(pattern, / ^ \ (\ ? ([\w$] + )\) / , function ($0, $1) {
      if (nativ.test.call(/[gy]/, $1)) {
        throw new SyntaxError("Cannot use flag g or y in mode modifier " + $0);
      }
      flags = clipDuplicates(flags + $1);
      return "";
    });
    for (i = 0; i < flags.length; ++i) {
      if (!registeredFlags[flags.charAt(i)]) {
        throw new SyntaxError("Unknown regex flag " + flags.charAt(i));
      }
    }
    return {
      pattern: pattern,
      flags: flags
    };
  }

  function prepareOptions(value) {
    value = value || {};
    if (isType(value, "String")) {
      value = self.forEach(value, / [ ^ \s, ] + /, function(match) {
              this[match] = true;
          }, {});
      }
      return value;
  }

  function registerFlag(flag) {
    if (!/ ^ [\w$] $ / .test(flag)) {
      throw new Error("Flag must be a single character A-Za-z0-9_$");
    }
    registeredFlags[flag] = true;
  }

  function runTokens(pattern, flags, pos, scope, context) {
    var i = tokens.length, result = null,, match, t
    //===================================================
    while (i--) {
      t = tokens[i];
      if ((t.scope === scope || t.scope === "all") && (!t.flag || flags.indexOf(t.flag) > -1)) {
        match = self.exec(pattern, t.regex, pos, "sticky");
        if (match) {
          result = {
            matchLength: match[0].length,
            output: t.handler.call(context, match, scope, flags),
            reparse: t.reparse
          };
          break;
        }
      }
    }
    return result;
  }

  function setAstral(on) {
    self.cache.flush("patterns");
    features.astral = on;
  }

  function setNatives(on) {
    RegExp.prototype.exec     = (on ? fixed : nativ).exec;
    RegExp.prototype.test     = (on ? fixed : nativ).test;
    String.prototype.match    = (on ? fixed : nativ).match;
    String.prototype.replace  = (on ? fixed : nativ).replace;
    String.prototype.split    = (on ? fixed : nativ).split;
    features.natives = on;
  }

  function toObject(value) {
    if (value == null) {
      throw new TypeError("Cannot convert null or undefined to object");
    }
    return value;
  }

  self = function (pattern, flags) {
    var context = {
      hasNamedCapture: false,
      captureNames: []
    },
      scope = defaultScope,
      output = "",
      pos = 0,
      result, token, key;
    if (self.isRegExp(pattern)) {
      if (flags !== undefined) {
        throw new TypeError("Cannot supply flags when copying a RegExp");
      }
      return copy(pattern, {
        addProto: true
      });
    }
    pattern = pattern === undefined ? "" : String(pattern);
    flags = flags === undefined ? "" : String(flags);
    key = pattern + "***" + flags;
    if (!patternCache[key]) {
      result = prepareFlags(pattern, flags);
      pattern = result.pattern;
      flags = result.flags;
      while (pos < pattern.length) {
        do {
          result = runTokens(pattern, flags, pos, scope, context);
          if (result && result.reparse) {
            pattern = pattern.slice(0, pos) + result.output + pattern.slice(pos + result.matchLength);
          }
        } while (result && result.reparse);
        if (result) {
          output += result.output;
          pos += result.matchLength || 1;
        } else {
          token = self.exec(pattern, nativeTokens[scope], pos, "sticky")[0];
          output += token;
          pos += token.length;
          if (token === "[" && scope === defaultScope) {
            scope = classScope;
          } else if (token === "]" && scope === classScope) {
            scope = defaultScope;
          }
        }
      }
      patternCache[key] = {
        pattern: nativ.replace.call(output, / \ (\ ? : \)( ? = \ (\ ? : \)) | ^ \ (\ ? : \) | \ (\ ? : \) $ / g, ""),
        flags: nativ.replace.call(flags, / [ ^ gimy] + /g, ""),
            captures: context.hasNamedCapture ? context.captureNames : null
        };
    }
    key = patternCache[key];
    return augment(new RegExp(key.pattern, key.flags), key.captures, true);
  };

  self.prototype  = new RegExp();
  self.version    = "3.0.0-pre";

  self.addToken   = function(regex, handler, options) {
      options = options || {};
      var optionalFlags = options.optionalFlags, i;
      if (options.flag) {
          registerFlag(options.flag);
      }
      if (optionalFlags) {
          optionalFlags = nativ.split.call(optionalFlags, "");
          for (i = 0; i < optionalFlags.length; ++i) {
              registerFlag(optionalFlags[i]);
          }
      }
      tokens.push({
          regex: copy(regex, {
              add: "g" + (hasNativeY ? "y" : "")
          }),
          handler: handler,
          scope: options.scope || defaultScope,
          flag: options.flag,
          reparse: options.reparse
      });
      self.cache.flush("patterns");
  };

  self.cache = function(pattern, flags) {
    var key = pattern + "***" + (flags || "");
    return cache[key] || (cache[key] = self(pattern, flags));
  };

  self.cache.flush = function(cacheName) {
    if (cacheName === "patterns") {
      patternCache = {};
    } else {
      cache = {};
    }
  };

  self.escape = function(str) {
    return nativ.replace.call(toObject(str), / [-[\] {}() * + ? ., \\ ^ $ | #\s] / g, "\\$&");
  };

  self.exec = function (str, regex, pos, sticky) {
    var cacheFlags = "g",
      match, r2;
    if (hasNativeY && (sticky || regex.sticky && sticky !== false)) {
      cacheFlags += "y";
    }
    regex[REGEX_DATA] = regex[REGEX_DATA] || getBaseProps();
    r2 = regex[REGEX_DATA][cacheFlags] || (regex[REGEX_DATA][cacheFlags] = copy(regex, {
      add: cacheFlags,
      remove: sticky === false ? "y" : ""
    }));
    r2.lastIndex = pos = pos || 0;
    match = fixed.exec.call(r2, str);
    if (sticky && match && match.index !== pos) {
      match = null;
    }
    if (regex.global) {
      regex.lastIndex = match ? r2.lastIndex : 0;
    }
    return match;
  };


  self.forEach = function (str, regex, callback, context) {
    var pos = 0, i = -1, match
    ;//=================================================
    while (match = self.exec(str, regex, pos)) {
      callback.call(context, match, ++i, str, regex);
      pos = match.index + (match[0].length || 1);
    }
    return context;
  };

  self.globalize = function (regex) {
    return copy(regex, {
      add: "g",
      addProto: true
    });
  };

  self.install = function (options) {
    options = prepareOptions(options);
    if (!features.astral && options.astral) {
      setAstral(true);
    }
    if (!features.natives && options.natives) {
      setNatives(true);
    }
  };

  self.isInstalled = function (feature) {
    return !!features[feature];
  };

  self.isRegExp = function (value) {
    return toString.call(value) === "[object RegExp]";
  };

  self.match = function (str, regex, scope) {
    var global      = regex.global && scope !== "one" || scope === "all"
      , cacheFlags  = (global ? "g" : "") + (regex.sticky ? "y" : "")
      , result
      , r2
    ;//===============================================
    regex[REGEX_DATA] = regex[REGEX_DATA] || getBaseProps();
    r2 = regex[REGEX_DATA][cacheFlags || "noGY"] || (regex[REGEX_DATA][cacheFlags || "noGY"] = copy(regex, {
      add: cacheFlags, remove: scope === "one" ? "g" : ""
    }));
    result = nativ.match.call(toObject(str), r2);
    if (regex.global) {
      regex.lastIndex = scope === "one" && result ? result.index + result[0].length : 0;
    }
    return global ? result || [] : result && result[0];
  };

  self.matchChain = function (str, chain) {
    return function recurseChain(values, level) {
      var item = chain[level].regex ? chain[level] : {
        regex: chain[level]
      },
        matches = [],
        addMatch = function (match) {
          if (item.backref) {
            if (!(match.hasOwnProperty(item.backref) || +item.backref < match.length)) {
              throw new ReferenceError("Backreference to undefined group: " + item.backref);
            }
            matches.push(match[item.backref] || "");
          } else {
            matches.push(match[0]);
          }
        },
        i;
      for (i = 0; i < values.length; ++i) {
        self.forEach(values[i], item.regex, addMatch);
      }
      return level === chain.length - 1 || !matches.length ? matches : recurseChain(matches, level + 1);
    }([str], 0);
  };

  self.replace = function (str, search, replacement, scope) {
    var isRegex = self.isRegExp(search),
      global = search.global && scope !== "one" || scope === "all",
      cacheFlags = (global ? "g" : "") + (search.sticky ? "y" : ""),
      s2 = search,
      result;
    if (isRegex) {
      search[REGEX_DATA] = search[REGEX_DATA] || getBaseProps();
      s2 = search[REGEX_DATA][cacheFlags || "noGY"] || (search[REGEX_DATA][cacheFlags || "noGY"] = copy(search, {
        add: cacheFlags,
        remove: scope === "one" ? "g" : ""
      }));
    } else if (global) {
      s2 = new RegExp(self.escape(String(search)), "g");
    }
    result = fixed.replace.call(toObject(str), s2, replacement);
    if (isRegex && search.global) {
      search.lastIndex = 0;
    }
    return result;
  };

  self.replaceEach = function (str, replacements) {
    var i, r;
    for (i = 0; i < replacements.length; ++i) {
      r = replacements[i];
      str = self.replace(str, r[0], r[1], r[2]);
    }
    return str;
  };

  self.split = function (str, separator, limit) {
    return fixed.split.call(toObject(str), separator, limit);
  };

  self.test = function (str, regex, pos, sticky) {
    return !!self.exec(str, regex, pos, sticky);
  };

  self.uninstall = function (options) {
    options = prepareOptions(options);
    if (features.astral && options.astral) {
      setAstral(false);
    }
    if (features.natives && options.natives) {
      setNatives(false);
    }
  };

  self.union = function (patterns, flags) {
    var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g,
      output = [],
      numCaptures = 0,
      numPriorCaptures, captureNames, pattern, rewrite = function (match, paren, backref) {
        var name = captureNames[numCaptures - numPriorCaptures];
        if (paren) {
          ++numCaptures;
          if (name) {
            return "(?<" + name + ">";
          }
        } else if (backref) {
          return "\\" + (+backref + numPriorCaptures);
        }
        return match;
      },
      i;
    if (!(isType(patterns, "Array") && patterns.length)) {
      throw new TypeError("Must provide a nonempty array of patterns to merge");
    }
    for (i = 0; i < patterns.length; ++i) {
      pattern = patterns[i];
      if (self.isRegExp(pattern)) {
        numPriorCaptures = numCaptures;
        captureNames = pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames || [];
        output.push(nativ.replace.call(self(pattern.source).source, parts, rewrite));
      } else {
        output.push(self.escape(pattern));
      }
    }
    return self(output.join("|"), flags);
  };


  fixed.exec = function (str) {
    var origLastIndex = this.lastIndex,
      match = nativ.exec.apply(this, arguments),
      name, r2, i;
    if (match) {
      if (!correctExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
        r2 = copy(this, {
          remove: "g"
        });
        nativ.replace.call(String(str).slice(match.index), r2, function () {
          var len = arguments.length,
            i;
          for (i = 1; i < len - 2; ++i) {
            if (arguments[i] === undefined) {
              match[i] = undefined;
            }
          }
        });
      }
      if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
        for (i = 1; i < match.length; ++i) {
          name = this[REGEX_DATA].captureNames[i - 1];
          if (name) {
            match[name] = match[i];
          }
        }
      }
      if (this.global && !match[0].length && this.lastIndex > match.index) {
        this.lastIndex = match.index;
      }
    }
    if (!this.global) {
      this.lastIndex = origLastIndex;
    }
    return match;
  };
  fixed.test = function (str) {
    return !!fixed.exec.call(this, str);
  };


  fixed.match = function (regex) {
    var result;
    if (!self.isRegExp(regex)) {
      regex = new RegExp(regex);
    } else if (regex.global) {
      result = nativ.match.apply(this, arguments);
      regex.lastIndex = 0;
      return result;
    }
    return fixed.exec.call(regex, toObject(this));
  };

  fixed.replace = function (search, replacement) {
    var isRegex = self.isRegExp(search),
      origLastIndex, captureNames, result;
    if (isRegex) {
      if (search[REGEX_DATA]) {
        captureNames = search[REGEX_DATA].captureNames;
      }
      origLastIndex = search.lastIndex;
    } else {
      search += "";
    }
    if (isType(replacement, "Function")) {
      result = nativ.replace.call(String(this), search, function () {
        var args = arguments,
          i;
        if (captureNames) {
          args[0] = new String(args[0]);
          for (i = 0; i < captureNames.length; ++i) {
            if (captureNames[i]) {
              args[0][captureNames[i]] = args[i + 1];
            }
          }
        }
        if (isRegex && search.global) {
          search.lastIndex = args[args.length - 2] + args[0].length;
        }
        return replacement.apply(undefined, args);
      });
    } else {
      result = nativ.replace.call(this == null ? this : String(this), search, function () {
        var args = arguments;
        return nativ.replace.call(String(replacement), replacementToken, function ($0, $1, $2) {
          var n;
          if ($1) {
            n = +$1;
            if (n <= args.length - 3) {
              return args[n] || "";
            }
            n = captureNames ? indexOf(captureNames, $1) : -1;
            if (n < 0) {
              throw new SyntaxError("Backreference to undefined group " + $0);
            }
            return args[n + 1] || "";
          }
          if ($2 === "$") {
            return "$";
          }
          if ($2 === "&" || +$2 === 0) {
            return args[0];
          }
          if ($2 === "`") {
            return args[args.length - 1].slice(0, args[args.length - 2]);
          }
          if ($2 === "'") {
            return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
          }
          $2 = +$2;
          if (!isNaN($2)) {
            if ($2 > args.length - 3) {
              throw new SyntaxError("Backreference to undefined group " + $0);
            }
            return args[$2] || "";
          }
          throw new SyntaxError("Invalid token " + $0);
        });
      });
    }
    if (isRegex) {
      if (search.global) {
        search.lastIndex = 0;
      } else {
        search.lastIndex = origLastIndex;
      }
    }
    return result;
  };

  fixed.split = function (separator, limit) {
    if (!self.isRegExp(separator)) {
      return nativ.split.apply(this, arguments);
    }
    var str = String(this),
      output = [],
      origLastIndex = separator.lastIndex,
      lastLastIndex = 0,
      lastLength;
    limit = (limit === undefined ? -1 : limit) >>> 0;
    self.forEach(str, separator, function (match) {
      if (match.index + match[0].length > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = match.index + lastLength;
      }
    });
    if (lastLastIndex === str.length) {
      if (!nativ.test.call(separator, "") || lastLength) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    separator.lastIndex = origLastIndex;
    return output.length > limit ? output.slice(0, limit) : output;
  };

  add = self.addToken;
  add(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4})|x(?![\dA-Fa-f]{2}))/, function (match, scope) {
    if (match[1] === "B" && scope === defaultScope) {
      return match[0];
    }
    throw new SyntaxError("Invalid escape " + match[0]);
  }, {
    scope: "all"
  });

  add(/\[(\^?)]/, function (match) {
    return match[1] ? "[\\s\\S]" : "\\b\\B";
  });

  add(/\(\?#[^)]*\)/, function (match, scope, flags) {
    return isQuantifierNext(match.input, match.index + match[0].length, flags) ? "" : "(?:)";
  });

  add(/\s+|#.*/, function (match, scope, flags) {
    return isQuantifierNext(match.input, match.index + match[0].length, flags) ? "" : "(?:)";
  }, { flag: "x" });

  add(/\./, function () {
    return "[\\s\\S]";
  }, { flag: "s" });

  add(/\\k<([\w$]+)>/, function (match) {
    var index = isNaN(match[1]) ? indexOf(this.captureNames, match[1]) + 1 : +match[1], endIndex = match.index + match[0].length;
    if (!index || index > this.captureNames.length) {
      throw new SyntaxError("Backreference to undefined group " + match[0]);
    }
    return "\\" + index + (endIndex === match.input.length || isNaN(match.input.charAt(endIndex)) ? "" : "(?:)");
  });

  add(/\\(\d+)/, function (match, scope) {
    if (!(scope === defaultScope && /^[1-9]/.test(match[1]) && +match[1] <= this.captureNames.length) && match[1] !== "0") {
      throw new SyntaxError("Cannot use octal escape or backreference to undefined group " + match[0]);
    }
    return match[0];
  }, { scope: "all" });

  add(/\(\?P?<([\w$]+)>/, function (match) {
    if (!isNaN(match[1])) {
      throw new SyntaxError("Cannot use integer as capture name " + match[0]);
    }
    if (match[1] === "length" || match[1] === "__proto__") {
      throw new SyntaxError("Cannot use reserved word as capture name " + match[0]);
    }
    if (indexOf(this.captureNames, match[1]) > -1) {
      throw new SyntaxError("Cannot use same name for multiple groups " + match[0]);
    }
    this.captureNames.push(match[1]);
    this.hasNamedCapture = true;
    return "(";
  });

  add(/\((?!\?)/, function (match, scope, flags) {
    if (flags.indexOf("n") > -1) {
      return "(?:";
    }
    this.captureNames.push(null);
    return "(";
  }, { optionalFlags: "n" });

  return self;
}();

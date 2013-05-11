function css(u, f) {function b() {
    return c = u.charAt(++s)
  }function r(a) {
    for (var k = s; b();) if ("\\" == c) b(), b();
    else if (c == a) break;
    else if ("\n" == c) break;
    return u.substring(k, s + 1)
  }function g() {
    for (var c = s; a.test(u.charAt(s + 1));) s++;
    return s != c
  }function i() {
    var a = s;
    for (b(); b();) if ("*" == c && "/" == u.charAt(s + 1)) {
      s++;
      break
    }
    return u.substring(a, s + 1)
  }
  var f = f || {},
    h = f.indent_size || 4,
    A = f.indent_char || " ";
  "string" == typeof h && (h = parseInt(h));
  var a = /^\s+$/,
    s = -1,
    c, v = u.match(/^[\r\n]*[\t ]*/)[0],
    A = Array(h + 1).join(A),
    F = 0;
  print = {
    "{": function (a) {
      print.singleSpace();
      k.push(a);
      print.newLine()
    },
    "}": function (a) {
      print.newLine();
      k.push(a);
      print.newLine()
    },
    newLine: function (c) {
      if (!c) for (; a.test(k[k.length - 1]);) k.pop();
      k.length && k.push("\n");
      v && k.push(v)
    },
    singleSpace: function () {
      k.length && !a.test(k[k.length - 1]) && k.push(" ")
    }
  };
  var k = [];
  for (v && k.push(v);;) {
    var H;
    H = s;
    do;
    while (a.test(b()));
    H = s != H + 1;
    if (!c) break;
    "{" == c ? (F++, v += A, print["{"](c)) : "}" == c ? (F--, v = v.slice(0, -h), print["}"](c)) : '"' == c || "'" == c ? k.push(r(c)) : ";" == c ? k.push(c, "\n", v) : "/" == c && "*" == u.charAt(s + 1) ? (print.newLine(), k.push(i(), "\n", v)) : "(" == c ? (k.push(c), g(), "url" == k.slice(-4, -1).join("").toLowerCase() && b() && (")" != c && '"' != c && "'" != c ? k.push(r(")")) : s--)) : ")" == c ? k.push(c) : "," == c ? (g(), k.push(c), print.singleSpace()) : ("]" != c && ("[" == c || "=" == c ? g() : H && print.singleSpace()), k.push(c))
  }
  return k.join("").replace(/[\n ]+$/, "")
}
"undefined" !== typeof exports && (exports.css = css);

function html(u, f) {
  var b, r, g, i, h, f = f || {};
  r = f.indent_size || 2;
  g = f.indent_char || " ";
  h = f.brace_style || "collapse";
  i = f.max_char || "800";
  unformatted = f.unformatted || ["a"];
  b = new function () {
    this.pos = 0;
    this.token = "";
    this.current_mode = "CONTENT";
    this.tags = {
      parent: "parent1",
      parentcount: 1,
      parent1: ""
    };
    this.token_text = this.last_token = this.last_text = this.token_type = this.tag_type = "";
    this.Utils = {
      whitespace: ["\n", "\r", "\t", " "],
      single_token: "br input link meta !doctype basefont base area hr wbr param img isindex ?xml embed".split(" "),
      extra_liners: ["head", "body", "/html"],
      in_array: function (a, b) {
        for (var c = 0; c < b.length; c++) if (a === b[c]) return !0;
        return !1
      }
    };
    this.get_content = function () {
      for (var a = "", b = [], c = !1;
      "<" !== this.input.charAt(this.pos);) {
        if (this.pos >= this.input.length) return b.length ? b.join("") : ["", "TK_EOF"];
        a = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;
        if (this.Utils.in_array(a, this.Utils.whitespace)) b.length && (c = !0), this.line_char_count--;
        else {
          if (c) {
            if (this.line_char_count >= this.max_char) {
              b.push("\n");
              for (c = 0; c < this.indent_level; c++) b.push(this.indent_string);
              this.line_char_count = 0
            } else b.push(" "), this.line_char_count++;
            c = !1
          }
          b.push(a)
        }
      }
      return b.length ? b.join("") : ""
    };
    this.get_contents_to = function (a) {
      if (this.pos == this.input.length) return ["", "TK_EOF"];
      var b = "",
        a = RegExp("</" + a + "\\s*>", "igm");
      a.lastIndex = this.pos;
      a = (a = a.exec(this.input)) ? a.index : this.input.length;
      this.pos < a && (b = this.input.substring(this.pos, a), this.pos = a);
      return b
    };
    this.record_tag = function (a) {
      this.tags[a + "count"] ? this.tags[a + "count"]++ : this.tags[a + "count"] = 1;
      this.tags[a + this.tags[a + "count"]] = this.indent_level;
      this.tags[a + this.tags[a + "count"] + "parent"] = this.tags.parent;
      this.tags.parent = a + this.tags[a + "count"]
    };
    this.retrieve_tag = function (a) {
      if (this.tags[a + "count"]) {
        for (var b = this.tags.parent; b && a + this.tags[a + "count"] !== b;) b = this.tags[b + "parent"];
        b && (this.indent_level = this.tags[a + this.tags[a + "count"]], this.tags.parent = this.tags[b + "parent"]);
        delete this.tags[a + this.tags[a + "count"] + "parent"];
        delete this.tags[a + this.tags[a + "count"]];
        1 == this.tags[a + "count"] ? delete this.tags[a + "count"] : this.tags[a + "count"]--
      }
    };
    this.get_tag = function () {
      var a = "",
        b = [],
        c = !1;
      do {
        if (this.pos >= this.input.length) return b.length ? b.join("") : ["", "TK_EOF"];
        a = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;
        if (this.Utils.in_array(a, this.Utils.whitespace)) c = !0, this.line_char_count--;
        else {
          if ("'" === a || '"' === a) if (!b[1] || "!" !== b[1]) a += this.get_unformatted(a), c = !0;
          "=" === a && (c = !1);
          b.length && ("=" !== b[b.length - 1] && ">" !== a && c) && (this.line_char_count >= this.max_char ? (this.print_newline(!1, b), this.line_char_count = 0) : (b.push(" "), this.line_char_count++), c = !1);
          b.push(a)
        }
      } while (">" !== a);
      a = b.join("");
      c = -1 != a.indexOf(" ") ? a.indexOf(" ") : a.indexOf(">");
      c = a.substring(1, c).toLowerCase();
      "/" === a.charAt(a.length - 2) || this.Utils.in_array(c, this.Utils.single_token) ? this.tag_type = "SINGLE" : "script" === c ? (this.record_tag(c), this.tag_type = "SCRIPT") : "style" === c ? (this.record_tag(c), this.tag_type = "STYLE") : this.Utils.in_array(c, unformatted) ? (a = this.get_unformatted("</" + c + ">", a), b.push(a), this.tag_type = "SINGLE") : "!" === c.charAt(0) ? -1 != c.indexOf("[if") ? (-1 != a.indexOf("!IE") && (a = this.get_unformatted("--\>", a), b.push(a)), this.tag_type = "START") : -1 != c.indexOf("[endif") ? (this.tag_type = "END", this.unindent()) : (a = -1 != c.indexOf("[cdata[") ? this.get_unformatted("]]\>", a) : this.get_unformatted("--\>", a), b.push(a), this.tag_type = "SINGLE") : ("/" === c.charAt(0) ? (this.retrieve_tag(c.substring(1)), this.tag_type = "END") : (this.record_tag(c), this.tag_type = "START"), this.Utils.in_array(c, this.Utils.extra_liners) && this.print_newline(!0, this.output));
      return b.join("")
    };
    this.get_unformatted = function (a, b) {
      if (b && -1 != b.indexOf(a)) return "";
      var c = "",
        g = "",
        f = !0;
      do {
        if (this.pos >= this.input.length) break;
        c = this.input.charAt(this.pos);
        this.pos++;
        if (this.Utils.in_array(c, this.Utils.whitespace)) {
          if (!f) {
            this.line_char_count--;
            continue
          }
          if ("\n" === c || "\r" === c) {
            g += "\n";
            this.line_char_count = 0;
            continue
          }
        }
        g += c;
        this.line_char_count++;
        f = !0
      } while (-1 == g.indexOf(a));
      return g
    };
    this.get_token = function () {
      var a;
      if ("TK_TAG_SCRIPT" === this.last_token || "TK_TAG_STYLE" === this.last_token) {
        var b = this.last_token.substr(7);
        a = this.get_contents_to(b);
        return "string" !== typeof a ? a : [a, "TK_" + b]
      }
      if ("CONTENT" === this.current_mode) return a = this.get_content(), "string" !== typeof a ? a : [a, "TK_CONTENT"];
      if ("TAG" === this.current_mode) return a = this.get_tag(), "string" !== typeof a ? a : [a, "TK_TAG_" + this.tag_type]
    };
    this.get_full_indent = function (a) {
      a = this.indent_level + a || 0;
      return 1 > a ? "" : Array(a + 1).join(this.indent_string)
    };
    this.printer = function (a, b, c, g, f) {
      this.input = a || "";
      this.output = [];
      this.indent_character = b;
      this.indent_string = "";
      this.indent_size = c;
      this.brace_style = f;
      this.indent_level = 0;
      this.max_char = g;
      for (a = this.line_char_count = 0; a < this.indent_size; a++) this.indent_string += this.indent_character;
      this.print_newline = function (a, b) {
        this.line_char_count = 0;
        if (b && b.length) {
          if (!a) for (; this.Utils.in_array(b[b.length - 1], this.Utils.whitespace);) b.pop();
          b.push("\n");
          for (var c = 0; c < this.indent_level; c++) b.push(this.indent_string)
        }
      };
      this.print_token = function (b) {
        this.output.push(b)
      };
      this.indent = function () {
        this.indent_level++
      };
      this.unindent = function () {
        0 < this.indent_level && this.indent_level--
      }
    };
    return this
  };
  for (b.printer(u, g, r, i, h);;) {
    r = b.get_token();
    b.token_text = r[0];
    b.token_type = r[1];
    if ("TK_EOF" === b.token_type) break;
    switch (b.token_type) {
    case "TK_TAG_START":
      b.print_newline(!1, b.output);
      b.print_token(b.token_text);
      b.indent();
      b.current_mode = "CONTENT";
      break;
    case "TK_TAG_STYLE":
    case "TK_TAG_SCRIPT":
      b.print_newline(!1, b.output);
      b.print_token(b.token_text);
      b.current_mode = "CONTENT";
      break;
    case "TK_TAG_END":
      "TK_CONTENT" === b.last_token && "" === b.last_text && (r = b.token_text.match(/\w+/)[0], g = b.output[b.output.length - 1].match(/<\s*(\w+)/), (null === g || g[1] !== r) && b.print_newline(!0, b.output));
      b.print_token(b.token_text);
      b.current_mode = "CONTENT";
      break;
    case "TK_TAG_SINGLE":
      b.print_newline(!1, b.output);
      b.print_token(b.token_text);
      b.current_mode = "CONTENT";
      break;
    case "TK_CONTENT":
      "" !== b.token_text && b.print_token(b.token_text);
      b.current_mode = "TAG";
      break;
    case "TK_STYLE":
    case "TK_SCRIPT":
      if ("" !== b.token_text) {
        b.output.push("\n");
        r = b.token_text;
        if ("TK_SCRIPT" == b.token_type) var A = "function" == typeof js && js;
        else "TK_STYLE" == b.token_type && (A = "function" == typeof css && css);
        i = "keep" == f.indent_scripts ? 0 : "separate" == f.indent_scripts ? -b.indent_level : 1;
        g = b.get_full_indent(i);
        A ? r = A(r.replace(/^\s*/, g), f) : (h = r.match(/^\s*/)[0].match(/[^\n\r]*$/)[0].split(b.indent_string).length - 1, i = b.get_full_indent(i - h), r = r.replace(/^\s*/, g).replace(/\r\n|\r|\n/g, "\n" + i).replace(/\s*$/, ""));
        r && (b.print_token(r), b.print_newline(!0, b.output))
      }
      b.current_mode = "TAG"
    }
    b.last_token = b.token_type;
    b.last_text = b.token_text
  }
  return b.output.join("")
}
"undefined" !== typeof exports && (exports.html = html);

function js(u, f) {function b(b) {
    for (b = "undefined" === typeof b ? !1 : b; o.length && (" " === o[o.length - 1] || o[o.length - 1] === C || o[o.length - 1] === K || b && ("\n" === o[o.length - 1] || "\r" === o[o.length - 1]));) o.pop()
  }function r(b) {
    return b.replace(/^\s\s*|\s\s*$/, "")
  }function g(a) {
    e.eat_next_space = !1;
    if (!x || !s(e.mode)) if (a = "undefined" === typeof a ? !0 : a, e.if_line = !1, b(), o.length) {
      if ("\n" !== o[o.length - 1] || !a) D = !0, o.push("\n");
      K && o.push(K);
      for (a = 0; a < e.indentation_level; a += 1) o.push(C);
      e.var_line && e.var_line_reindented && o.push(C);
      e.case_body && o.push(C)
    }
  }function i() {
    if ("TK_COMMENT" === j) return g();
    if (e.eat_next_space) e.eat_next_space = !1;
    else {
      var b = " ";
      o.length && (b = o[o.length - 1]);
      " " !== b && ("\n" !== b && b !== C) && o.push(" ")
    }
  }function h() {
    D = !1;
    e.eat_next_space = !1;
    o.push(q)
  }function A() {
    o.length && o[o.length - 1] === C && o.pop()
  }function a(b) {
    e && L.push(e);
    e = {
      previous_mode: e ? e.mode : "BLOCK",
      mode: b,
      var_line: !1,
      var_line_tainted: !1,
      var_line_reindented: !1,
      in_html_comment: !1,
      if_line: !1,
      in_case_statement: !1,
      in_case: !1,
      case_body: !1,
      eat_next_space: !1,
      indentation_baseline: -1,
      indentation_level: e ? e.indentation_level + (e.case_body ? 1 : 0) + (e.var_line && e.var_line_reindented ? 1 : 0) : 0,
      ternary_depth: 0
    }
  }function s(b) {
    return "[EXPRESSION]" === b || "[INDENTED-EXPRESSION]" === b
  }function c(b) {
    return k(b, ["[EXPRESSION]", "(EXPRESSION)", "(FOR-EXPRESSION)", "(COND-EXPRESSION)"])
  }function v() {
    M = "DO_BLOCK" === e.mode;
    if (0 < L.length) {
      var b = e.mode;
      e = L.pop();
      e.previous_mode = b
    }
  }function F(b) {
    return k(b, "case return do if throw else".split(" "))
  }function k(b, a) {
    for (var d = 0; d < a.length; d += 1) if (a[d] === b) return !0;
    return !1
  }function H(b) {
    for (var a = d, e = m.charAt(a); k(e, N) && e != b;) {
      a++;
      if (a >= t) return 0;
      e = m.charAt(a)
    }
    return e
  }function P() {
    z = 0;
    if (d >= t) return ["", "TK_EOF"];
    G = !1;
    var a = m.charAt(d);
    d += 1;
    if (x && s(e.mode)) {
      for (var c = 0; k(a, N);) {
        "\n" === a ? (b(), o.push("\n"), D = !0, c = 0) : "\t" === a ? c += 4 : "\r" !== a && (c += 1);
        if (d >= t) return ["", "TK_EOF"];
        a = m.charAt(d);
        d += 1
      } - 1 === e.indentation_baseline && (e.indentation_baseline = c);
      if (D) {
        var f;
        for (f = 0; f < e.indentation_level + 1; f += 1) o.push(C);
        if (-1 !== e.indentation_baseline) for (f = 0; f < c - e.indentation_baseline; f++) o.push(" ")
      }
    } else {
      for (; k(a, N);) {
        "\n" === a && (z += S ? z <= S ? 1 : 0 : 1);
        if (d >= t) return ["", "TK_EOF"];
        a = m.charAt(d);
        d += 1
      }
      if (Q && 1 < z) for (f = 0; f < z; f += 1) g(0 === f), D = !0;
      G = 0 < z
    }
    if (k(a, O)) {
      if (d < t) for (; k(m.charAt(d), O) && !(a += m.charAt(d), d += 1, d === t););
      if (d !== t && a.match(/^[0-9]+[Ee]$/) && ("-" === m.charAt(d) || "+" === m.charAt(d))) return c = m.charAt(d), d += 1, f = P(d), a += c + f[0], [a, "TK_WORD"];
      if ("in" === a) return [a, "TK_OPERATOR"];
      G && ("TK_OPERATOR" !== j && "TK_EQUALS" !== j && !e.if_line && (Q || "var" !== n)) && g();
      return [a, "TK_WORD"]
    }
    if ("(" === a || "[" === a) return [a, "TK_START_EXPR"];
    if (")" === a || "]" === a) return [a, "TK_END_EXPR"];
    if ("{" === a) return [a, "TK_START_BLOCK"];
    if ("}" === a) return [a, "TK_END_BLOCK"];
    if (";" === a) return [a, "TK_SEMICOLON"];
    if ("/" === a) {
      c = "";
      f = !0;
      if ("*" === m.charAt(d)) {
        d += 1;
        if (d < t) for (; d < t && !("*" === m.charAt(d) && m.charAt(d + 1) && "/" === m.charAt(d + 1));) {
          a = m.charAt(d);
          c += a;
          if ("\n" === a || "\r" === a) f = !1;
          d += 1;
          if (d >= t) break
        }
        d += 2;
        return f && 0 == z ? ["/*" + c + "*/", "TK_INLINE_COMMENT"] : ["/*" + c + "*/", "TK_BLOCK_COMMENT"]
      }
      if ("/" === m.charAt(d)) {
        for (c = a;
        "\r" !== m.charAt(d) && "\n" !== m.charAt(d) && !(c += m.charAt(d), d += 1, d >= t););
        G && g();
        return [c, "TK_COMMENT"]
      }
    }
    if ("'" === a || '"' === a || "/" === a && ("TK_WORD" === j && F(n) || ")" === n && k(e.previous_mode, ["(COND-EXPRESSION)", "(FOR-EXPRESSION)"]) || "TK_COMMENT" === j || "TK_START_EXPR" === j || "TK_START_BLOCK" === j || "TK_END_BLOCK" === j || "TK_OPERATOR" === j || "TK_EQUALS" === j || "TK_EOF" === j || "TK_SEMICOLON" === j)) {
      c = a;
      f = !1;
      var i = 0,
        l = 0,
        h = a;
      if (d < t) if ("/" === c) for (a = !1; f || a || m.charAt(d) !== c;) {
        if (h += m.charAt(d), f ? f = !1 : (f = "\\" === m.charAt(d), "[" === m.charAt(d) ? a = !0 : "]" === m.charAt(d) && (a = !1)), d += 1, d >= t) return [h, "TK_STRING"]
      } else for (; f || m.charAt(d) !== c;) {
        h += m.charAt(d);
        if (i && i >= l) {
          if ((i = parseInt(h.substr(-l), 16)) && 32 <= i && 126 >= i) i = String.fromCharCode(i), h = h.substr(0, h.length - l - 2) + (i === c || "\\" === i ? "\\" : "") + i;
          i = 0
        }
        i ? i++ : f ? (f = !1, U && ("x" === m.charAt(d) ? (i++, l = 2) : "u" === m.charAt(d) && (i++, l = 4))) : f = "\\" === m.charAt(d);
        d += 1;
        if (d >= t) return [h, "TK_STRING"]
      }
      d += 1;
      h += c;
      if ("/" === c) for (; d < t && k(m.charAt(d), O);) h += m.charAt(d), d += 1;
      return [h, "TK_STRING"]
    }
    if ("#" === a) {
      if (0 === o.length && "!" === m.charAt(d)) {
        for (h = a; d < t && "\n" != a;) a = m.charAt(d), h += a, d += 1;
        o.push(r(h) + "\n");
        g();
        return P()
      }
      c = "#";
      if (d < t && k(m.charAt(d), T)) {
        do a = m.charAt(d), c += a, d += 1;
        while (d < t && "#" !== a && "=" !== a);
        "#" !== a && ("[" === m.charAt(d) && "]" === m.charAt(d + 1) ? (c += "[]", d += 2) : "{" === m.charAt(d) && "}" === m.charAt(d + 1) && (c += "{}", d += 2));
        return [c, "TK_WORD"]
      }
    }
    if ("<" === a && "<\!--" === m.substring(d - 1, d + 3)) {
      d += 3;
      for (a = "<\!--";
      "\n" != m.charAt(d) && d < t;) a += m.charAt(d), d++;
      e.in_html_comment = !0;
      return [a, "TK_COMMENT"]
    }
    if ("-" === a && e.in_html_comment && "--\>" === m.substring(d - 1, d + 2)) return e.in_html_comment = !1, d += 2, G && g(), ["--\>", "TK_COMMENT"];
    if (k(a, I)) {
      for (; d < t && k(a + m.charAt(d), I) && !(a += m.charAt(d), d += 1, d >= t););
      return "," === a ? [a, "TK_COMMA"] : "=" === a ? [a, "TK_EQUALS"] : [a, "TK_OPERATOR"]
    }
    return [a, "TK_UNKNOWN"]
  }
  var m, o, q, j, n, p, y, e, L, C, N, O, I, d, E, T, l, J, M, G, D, z, K = "",
    f = f ? f : {},
    w;
  void 0 !== f.space_after_anon_function && void 0 === f.jslint_happy && (f.jslint_happy = f.space_after_anon_function);
  void 0 !== f.braces_on_own_line && (w = f.braces_on_own_line ? "expand" : "collapse");
  w = f.brace_style ? f.brace_style : w ? w : "collapse";
  y = f.indent_size ? f.indent_size : 4;
  E = f.indent_char ? f.indent_char : " ";
  var Q = "undefined" === typeof f.preserve_newlines ? !0 : f.preserve_newlines,
    S = "undefined" === typeof f.max_preserve_newlines ? !1 : f.max_preserve_newlines,
    x = "undefined" === typeof f.keep_array_indentation ? !1 : f.keep_array_indentation,
    V = "undefined" === typeof f.space_before_conditional ? !0 : f.space_before_conditional,
    R = "undefined" === typeof f.indent_case ? !1 : f.indent_case,
    U = "undefined" === typeof f.unescape_strings ? !1 : f.unescape_strings;
  D = !1;
  var t = u.length;
  for (C = ""; 0 < y;) C += E, y -= 1;
  for (; u && (" " === u.charAt(0) || "\t" === u.charAt(0));) K += u.charAt(0), u = u.substring(1);
  m = u;
  y = "";
  j = "TK_START_EXPR";
  p = n = "";
  o = [];
  M = !1;
  N = ["\n", "\r", "\t", " "];
  O = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$".split("");
  T = "0123456789".split("");
  I = "+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::";
  I += " <%= <% %> <?= <? ?>";
  I = I.split(" ");
  E = "continue try throw return var if switch case default for while break function".split(" ");
  L = [];
  a("BLOCK");
  for (d = 0;;) {
    J = P(d);
    q = J[0];
    J = J[1];
    if ("TK_EOF" === J) break;
    switch (J) {
    case "TK_START_EXPR":
      if ("[" === q) {
        if ("TK_WORD" === j || ")" === n) {
          k(n, E) && i();
          a("(EXPRESSION)");
          h();
          break
        }
        "[EXPRESSION]" === e.mode || "[INDENTED-EXPRESSION]" === e.mode ? "]" === p && "," === n ? ("[EXPRESSION]" === e.mode && (e.mode = "[INDENTED-EXPRESSION]", x || (e.indentation_level += 1)), a("[EXPRESSION]"), x || g()) : "[" === n ? ("[EXPRESSION]" === e.mode && (e.mode = "[INDENTED-EXPRESSION]", x || (e.indentation_level += 1)), a("[EXPRESSION]"), x || g()) : a("[EXPRESSION]") : a("[EXPRESSION]")
      } else "for" === y ? a("(FOR-EXPRESSION)") : k(y, ["if", "while"]) ? a("(COND-EXPRESSION)") : a("(EXPRESSION)");
      ";" === n || "TK_START_BLOCK" === j ? g() : "TK_END_EXPR" === j || "TK_START_EXPR" === j || "TK_END_BLOCK" === j || "." === n ? G && g() : "TK_WORD" !== j && "TK_OPERATOR" !== j ? i() : "function" === y || "typeof" === y ? i() : (k(n, E) || "catch" === n) && V && i();
      h();
      break;
    case "TK_END_EXPR":
      if ("]" === q) if (x) {
        if ("}" === n) {
          A();
          h();
          v();
          break
        }
      } else if ("[INDENTED-EXPRESSION]" === e.mode && "]" === n) {
        v();
        g();
        h();
        break
      }
      v();
      h();
      break;
    case "TK_START_BLOCK":
      "do" === y ? a("DO_BLOCK") : a("BLOCK");
      if ("expand" == w || "expand-strict" == w) {
        if (p = !1, "expand-strict" == w ? (p = "}" == H()) || g(!0) : "TK_OPERATOR" !== j && ("=" === n || F(n) && "else" !== n ? i() : g(!0)), h(), !p) e.indentation_level += 1
      } else "TK_OPERATOR" !== j && "TK_START_EXPR" !== j ? "TK_START_BLOCK" === j ? g() : i() : s(e.previous_mode) && "," === n && ("}" === p ? i() : g()), e.indentation_level += 1, h();
      break;
    case "TK_END_BLOCK":
      v();
      "expand" == w || "expand-strict" == w ? "{" !== n && g() : "TK_START_BLOCK" === j ? D ? A() : b() : s(e.mode) && x ? (x = !1, g(), x = !0) : g();
      h();
      break;
    case "TK_WORD":
      if (M) {
        i();
        h();
        i();
        M = !1;
        break
      }
      if ("function" === q) {
        e.var_line && (e.var_line_reindented = !0);
        if ((D || ";" === n) && "{" !== n && "TK_BLOCK_COMMENT" != j && "TK_COMMENT" != j) {
          z = D ? z : 0;
          Q || (z = 1);
          for (l = 0; l < 2 - z; l++) g(!1)
        }("TK_WORD" == j || "get" === n || "set" === n || "new" === n) && i();
        h();
        y = q;
        break
      }
      if ("case" === q || "default" === q && e.in_case_statement) {
        ":" === n || e.case_body ? A() : (R || e.indentation_level--, g(), R || e.indentation_level++);
        h();
        e.in_case = !0;
        e.in_case_statement = !0;
        e.case_body = !1;
        break
      }
      l = "NONE";
      "TK_END_BLOCK" === j ? k(q.toLowerCase(), ["else", "catch", "finally"]) ? "expand" == w || "end-expand" == w || "expand-strict" == w ? l = "NEWLINE" : (l = "SPACE", i()) : l = "NEWLINE" : "TK_SEMICOLON" === j && ("BLOCK" === e.mode || "DO_BLOCK" === e.mode) ? l = "NEWLINE" : "TK_SEMICOLON" === j && c(e.mode) ? l = "SPACE" : "TK_STRING" === j ? l = "NEWLINE" : "TK_WORD" === j ? ("else" === n && b(!0), l = "SPACE") : "TK_START_BLOCK" === j ? l = "NEWLINE" : "TK_END_EXPR" === j && (i(), l = "NEWLINE");
      k(q, E) && ")" !== n && (l = "else" == n ? "SPACE" : "NEWLINE");
      e.if_line && "TK_END_EXPR" === j && (e.if_line = !1);
      if (k(q.toLowerCase(), ["else", "catch", "finally"])) "TK_END_BLOCK" !== j || "expand" == w || "end-expand" == w || "expand-strict" == w ? g() : (b(!0), i());
      else if ("NEWLINE" === l) if (F(n)) i();
      else if ("TK_END_EXPR" !== j) {
        if (("TK_START_EXPR" !== j || "var" !== q) && ":" !== n) "if" === q && "else" === y && "{" !== n ? i() : (e.var_line = !1, e.var_line_reindented = !1, g())
      } else k(q, E) && ")" != n && (e.var_line = !1, e.var_line_reindented = !1, g());
      else s(e.mode) && "," === n && "}" === p ? g() : "SPACE" === l && i();
      h();
      y = q;
      "var" === q && (e.var_line = !0, e.var_line_reindented = !1, e.var_line_tainted = !1);
      "if" === q && (e.if_line = !0);
      "else" === q && (e.if_line = !1);
      break;
    case "TK_SEMICOLON":
      h();
      e.var_line = !1;
      e.var_line_reindented = !1;
      "OBJECT" == e.mode && (e.mode = "BLOCK");
      break;
    case "TK_STRING":
      "TK_END_EXPR" === j && k(e.previous_mode, ["(COND-EXPRESSION)", "(FOR-EXPRESSION)"]) ? i() : "TK_COMMENT" === j || "TK_STRING" == j || "TK_START_BLOCK" === j || "TK_END_BLOCK" === j || "TK_SEMICOLON" === j ? g() : "TK_WORD" === j && i();
      h();
      break;
    case "TK_EQUALS":
      e.var_line && (e.var_line_tainted = !0);
      i();
      h();
      i();
      break;
    case "TK_COMMA":
      if (e.var_line) {
        c(e.mode) && (e.var_line_tainted = !1);
        if (e.var_line_tainted) {
          h();
          e.var_line_reindented = !0;
          e.var_line_tainted = !1;
          g();
          break
        } else e.var_line_tainted = !1;
        h();
        i();
        break
      }
      "TK_COMMENT" == j && g();
      "TK_END_BLOCK" === j && "(EXPRESSION)" !== e.mode ? (h(), "OBJECT" === e.mode && "}" === n ? g() : i()) : "OBJECT" === e.mode ? (h(), g()) : (h(), i());
      break;
    case "TK_OPERATOR":
      var B = l = !0;
      if (F(n)) {
        i();
        h();
        break
      }
      if ("*" == q && "TK_UNKNOWN" == j && !p.match(/^\d+$/)) {
        h();
        break
      }
      if (":" === q && e.in_case) {
        R && (e.case_body = !0);
        h();
        g();
        e.in_case = !1;
        break
      }
      if ("::" === q) {
        h();
        break
      }
      k(q, ["--", "++", "!"]) || k(q, ["-", "+"]) && (k(j, ["TK_START_BLOCK", "TK_START_EXPR", "TK_EQUALS", "TK_OPERATOR"]) || k(n, E)) ? (B = l = !1, ";" === n && c(e.mode) && (l = !0), "TK_WORD" === j && k(n, E) && (l = !0), "BLOCK" === e.mode && ("{" === n || ";" === n) && g()) : "." === q ? l = !1 : ":" === q ? 0 == e.ternary_depth ? ("BLOCK" == e.mode && (e.mode = "OBJECT"), l = !1) : e.ternary_depth -= 1 : "?" === q && (e.ternary_depth += 1);
      l && i();
      h();
      B && i();
      break;
    case "TK_BLOCK_COMMENT":
      p = q;
      p = p.replace(/\x0d/g, "");
      l = [];
      for (B = p.indexOf("\n"); - 1 != B;) l.push(p.substring(0, B)), p = p.substring(B + 1), B = p.indexOf("\n");
      p.length && l.push(p);
      p = l;
      a: {
        l = p.slice(1);
        for (B = 0; B < l.length; B++) if ("*" !== r(l[B]).charAt(0)) {
          l = !1;
          break a
        }
        l = !0
      }
      if (l) {
        g();
        o.push(p[0]);
        for (l = 1; l < p.length; l++) g(), o.push(" "), o.push(r(p[l]))
      } else {
        1 < p.length ? g() : "TK_END_BLOCK" === j ? g() : i();
        for (l = 0; l < p.length; l++) o.push(p[l]), o.push("\n")
      }
      "\n" != H("\n") && g();
      break;
    case "TK_INLINE_COMMENT":
      i();
      h();
      c(e.mode) ? i() : (p = x, x = !1, g(), x = p);
      break;
    case "TK_COMMENT":
      "," == n && !G && b(!0);
      "TK_COMMENT" != j && (G ? g() : i());
      h();
      break;
    case "TK_UNKNOWN":
      F(n) && i(), h()
    }
    p = n;
    j = J;
    n = q
  }
  return K + o.join("").replace(/[\r\n ]+$/, "")
}
"undefined" !== typeof exports && (exports.js = js);
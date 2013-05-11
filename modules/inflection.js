var InflectionJS = {
  uncountable_words: ["equipment", "information", "rice", "money", "species", "series", "fish", "sheep", "moose", "deer", "news"],
  plural_rules: [
    [new RegExp("(m)an$", "gi"), "$1en"],
    [new RegExp("(pe)rson$", "gi"), "$1ople"],
    [new RegExp("(child)$", "gi"), "$1ren"],
    [new RegExp("^(ox)$", "gi"), "$1en"],
    [new RegExp("(ax|test)is$", "gi"), "$1es"],
    [new RegExp("(octop|vir)us$", "gi"), "$1i"],
    [new RegExp("(alias|status)$", "gi"), "$1es"],
    [new RegExp("(bu)s$", "gi"), "$1ses"],
    [new RegExp("(buffal|tomat|potat)o$", "gi"), "$1oes"],
    [new RegExp("([ti])um$", "gi"), "$1a"],
    [new RegExp("sis$", "gi"), "ses"],
    [new RegExp("(?:([^f])fe|([lr])f)$", "gi"), "$1$2ves"],
    [new RegExp("(hive)$", "gi"), "$1s"],
    [new RegExp("([^aeiouy]|qu)y$", "gi"), "$1ies"],
    [new RegExp("(x|ch|ss|sh)$", "gi"), "$1es"],
    [new RegExp("(matr|vert|ind)ix|ex$", "gi"), "$1ices"],
    [new RegExp("([m|l])ouse$", "gi"), "$1ice"],
    [new RegExp("(quiz)$", "gi"), "$1zes"],
    [new RegExp("s$", "gi"), "s"],
    [new RegExp("$", "gi"), "s"]
  ],
  singular_rules: [
    [new RegExp("(m)en$", "gi"), "$1an"],
    [new RegExp("(pe)ople$", "gi"), "$1rson"],
    [new RegExp("(child)ren$", "gi"), "$1"],
    [new RegExp("([ti])a$", "gi"), "$1um"],
    [new RegExp("((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$", "gi"), "$1$2sis"],
    [new RegExp("(hive)s$", "gi"), "$1"],
    [new RegExp("(tive)s$", "gi"), "$1"],
    [new RegExp("(curve)s$", "gi"), "$1"],
    [new RegExp("([lr])ves$", "gi"), "$1f"],
    [new RegExp("([^fo])ves$", "gi"), "$1fe"],
    [new RegExp("([^aeiouy]|qu)ies$", "gi"), "$1y"],
    [new RegExp("(s)eries$", "gi"), "$1eries"],
    [new RegExp("(m)ovies$", "gi"), "$1ovie"],
    [new RegExp("(x|ch|ss|sh)es$", "gi"), "$1"],
    [new RegExp("([m|l])ice$", "gi"), "$1ouse"],
    [new RegExp("(bus)es$", "gi"), "$1"],
    [new RegExp("(o)es$", "gi"), "$1"],
    [new RegExp("(shoe)s$", "gi"), "$1"],
    [new RegExp("(cris|ax|test)es$", "gi"), "$1is"],
    [new RegExp("(octop|vir)i$", "gi"), "$1us"],
    [new RegExp("(alias|status)es$", "gi"), "$1"],
    [new RegExp("^(ox)en", "gi"), "$1"],
    [new RegExp("(vert|ind)ices$", "gi"), "$1ex"],
    [new RegExp("(matr)ices$", "gi"), "$1ix"],
    [new RegExp("(quiz)zes$", "gi"), "$1"],
    [new RegExp("s$", "gi"), ""]
  ],
  non_titlecased_words: ["and", "or", "nor", "a", "an", "the", "so", "but", "to", "of", "at", "by", "from", "into", "on", "onto", "off", "out", "in", "over", "with", "for"],
  id_suffix: new RegExp("([A-Za-z0-9])(_id|Id|id_|_ID)(s?)$", "g"),
  underbar: new RegExp("_", "g"),
  space_or_underbar: new RegExp("[ _-]+", "g"),
  uppercase: new RegExp("([A-Z])", "g"),
  underbar_prefix: new RegExp("^_"),
  camel_space_or_underbar: /([a-z])[-_ ]?([A-Z])/g,
  apply_rules: function (str, rules, skip, override) {
    if (override) {
      str = override;
    } else {
      var ignore = skip.indexOf(str.toLowerCase()) > -1;
      if (!ignore) {
        for (var x = 0; x < rules.length; x++) {
          if (str.match(rules[x][0])) {
            str = str.replace(rules[x][0], rules[x][1]);
            break;
          }
        }
      }
    }
    return str;
  }
};

InflectionJS.pluralize = function (str, plural) {
  return InflectionJS.apply_rules(str, InflectionJS.plural_rules, InflectionJS.uncountable_words, plural);
};

InflectionJS.singularize = function (str, singular) {
  return InflectionJS.apply_rules(str, InflectionJS.singular_rules, InflectionJS.uncountable_words, singular);
};

InflectionJS.camelize = function (str, lowFirstLetter) {
  var str_path = str.toLowerCase().split("/");
  for (var i = 0; i < str_path.length; i++) {
    var str_arr = str_path[i].split(InflectionJS.space_or_underbar);
    var initX = lowFirstLetter && i + 1 === str_path.length ? 1 : 0;
    for (var x = initX; x < str_arr.length; x++) {
      str_arr[x] = str_arr[x].charAt(0).toUpperCase() + str_arr[x].substring(1);
    }
    str_path[i] = str_arr.join("");
  }
  return str_path.join("::");
};

InflectionJS.underscore = function (str) {
  var str_path = str.split("::");
  for (var i = 0; i < str_path.length; i++) {
    str_path[i] = str_path[i].replace(InflectionJS.uppercase, "_$1");
    str_path[i] = str_path[i].replace(InflectionJS.underbar_prefix, "");
  }
  return str_path.join("/").toLowerCase();
};

InflectionJS.humanize = function (str, lowFirstLetter) {
  var rstr = str.replace(InflectionJS.id_suffix, "$1$3").replace(InflectionJS.camel_space_or_underbar, "$1 $2").replace(".", " ").toLowerCase();
  if (!lowFirstLetter) return InflectionJS.capitalize(rstr);
  return rstr;
};

InflectionJS.capitalize = function (str) {
  return str.toLowerCase().substring(0, 1).toUpperCase() + str.substring(1);
};

InflectionJS.dasherize = function (str) {
  return str.replace(InflectionJS.space_or_underbar, "-");
};

InflectionJS.titleize = function (str) {
  var d = str.toLowerCase().split(InflectionJS.space_or_underbar);
  for (var i = 0, l = d.length; i < l; i++) {
    var w = d[i];
    if (InflectionJS.non_titlecased_words.indexOf(w) < 0) {
      d[i] = InflectionJS.capitalize(w);
    }
  }
  return d.join(" ");
};

InflectionJS.ordinalize = function (str) {
  var str_arr = str.split(" ");
  for (var x = 0; x < str_arr.length; x++) {
    var i = parseInt(str_arr[x]);
    if (i === NaN) {
      var ltd = str_arr[x].substring(str_arr[x].length - 2);
      var ld = str_arr[x].substring(str_arr[x].length - 1);
      var suf = "th";
      if (ltd != "11" && ltd != "12" && ltd != "13") {
        if (ld === "1") {
          suf = "st";
        } else if (ld === "2") {
          suf = "nd";
        } else if (ld === "3") {
          suf = "rd";
        }
      }
      str_arr[x] += suf;
    }
  }
  return str_arr.join(" ");
};

InflectionJS.underscore = function (camelCaseStr) {
  return InflectionJS.camelTo(camelCaseStr, "_");
};

InflectionJS.hyphenize = function (camelCaseStr) {
  return InflectionJS.camelTo(camelCaseStr, "-");
};

InflectionJS.camelTo = function camelTo(camelCaseStr, delim) {
  return camelCaseStr.replace(/([a-z])([A-Z])/g, "$1" + delim + "$2").toLowerCase();
};

module.exports = InflectionJS;

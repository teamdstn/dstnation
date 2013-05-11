var Stemmer = require("./stemmer");
function categorizeGroups(token) {
  return token.replace(/[^aeiou]+/g, "C").replace(/[aeiouy]+/g, "V");
}
function categorizeChars(token) {
  return token.replace(/[^aeiou]/g, "C").replace(/[aeiouy]/g, "V");
}
function measure(token) {
  if (!token) return -1;
  return categorizeGroups(token).replace(/^C/, "").replace(/V$/, "").length / 2;
}
function endsWithDoublCons(token) {
  return token.match(/([^aeiou])\1$/);
}
function attemptReplace(token, pattern, replacement, callback) {
  var result = null;
  if (typeof pattern == "string" && token.substr(0 - pattern.length) == pattern) result = token.replace(new RegExp(pattern + "$"), replacement);
  else if (pattern instanceof RegExp && token.match(pattern)) result = token.replace(pattern, replacement);
  if (result && callback) return callback(result);
  else return result;
}
function attemptReplacePatterns(token, replacements, measureThreshold) {
  var replacement = null;
  for (var i = 0; i < replacements.length; i++) {
    if (measureThreshold == null || measure(attemptReplace(token, replacements[i][0], "")) > measureThreshold) replacement = attemptReplace(token, replacements[i][0], replacements[i][1]);
    if (replacement) break;
  }
  return replacement;
}
function replacePatterns(token, replacements, measureThreshold) {
  var result = attemptReplacePatterns(token, replacements, measureThreshold);
  token = result == null ? token : result;
  return token;
}
function step1a(token) {
  if (token.match(/(ss|i)es$/)) return token.replace(/(ss|i)es$/, "$1");
  if (token.substr(-1) == "s" && token.substr(-2, 1) != "s") return token.replace(/s?$/, "");
  return token;
}
function step1b(token) {
  if (token.substr(-3) == "eed") {
    if (measure(token.substr(0, token.length - 3)) > 0) return token.replace(/eed$/, "ee");
  } else {
    var result = attemptReplace(token, / ed | ing$ / , "", function (token) {
      if (categorizeGroups(token).indexOf("V") > 0) {
        result = attemptReplacePatterns(token, [
          ["at", "ate"],
          ["bl", "ble"],
          ["iz", "ize"]
        ]);
        if (result) return result;
        else {
          if (endsWithDoublCons(token) && token.match(/[^lsz]$/)) return token.replace(/([^aeiou])\1$/, "$1");
          if (measure(token) == 1 && categorizeChars(token).substr(-3) == "CVC" && token.match(/[^wxy]$/)) return token + "e";
        }
        return token;
      }
      return null;
    });
    if (result) return result;
  }
  return token;
}
function step1c(token) {
  if (categorizeGroups(token).substr(-2, 1) == "V") {
    if (token.substr(-1) == "y") return token.replace(/y$/, "i");
  }
  return token;
}
function step2(token) {
  return replacePatterns(token, [
    ["ational", "ate"],
    ["tional", "tion"],
    ["enci", "ence"],
    ["anci", "ance"],
    ["izer", "ize"],
    ["abli", "able"],
    ["alli", "al"],
    ["entli", "ent"],
    ["eli", "e"],
    ["ousli", "ous"],
    ["ization", "ize"],
    ["ation", "ate"],
    ["ator", "ate"],
    ["alism", "al"],
    ["iveness", "ive"],
    ["fulness", "ful"],
    ["ousness", "ous"],
    ["aliti", "al"],
    ["iviti", "ive"],
    ["biliti", "ble"]
  ], 0);
}
function step3(token) {
  return replacePatterns(token, [
    ["icate", "ic"],
    ["ative", ""],
    ["alize", "al"],
    ["iciti", "ic"],
    ["ical", "ic"],
    ["ful", ""],
    ["ness", ""]
  ], 0);
}
function step4(token) {
  return replacePatterns(token, [
    ["al", ""],
    ["ance", ""],
    ["ence", ""],
    ["er", ""],
    ["ic", ""],
    ["able", ""],
    ["ible", ""],
    ["ant", ""],
    ["ement", ""],
    ["ment", ""],
    ["ent", ""],
    [/([st])ion/, "$1"],
    ["ou", ""],
    ["ism", ""],
    ["ate", ""],
    ["iti", ""],
    ["ous", ""],
    ["ive", ""],
    ["ize", ""]
  ], 1);
}
function step5a(token) {
  var m = measure(token);
  if (m > 1 && token.substr(-1) == "e" || m == 1 && !(categorizeChars(token).substr(-4, 3) == "CVC" && token.match(/[^wxy].$/))) return token.replace(/e$/, "");
  return token;
}
function step5b(token) {
  if (measure(token) > 1) {
    if (endsWithDoublCons(token) && token.substr(-2) == "ll") return token.replace(/ll$/, "l");
  }
  return token;
}
var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;
PorterStemmer.stem = function (token) {
  return step5b(step5a(step4(step3(step2(step1c(step1b(step1a(token.toLowerCase())))))))).toString();
};

PorterStemmer.step1a  = step1a;
PorterStemmer.step1b  = step1b;
PorterStemmer.step1c  = step1c;
PorterStemmer.step2   = step2;
PorterStemmer.step3   = step3;
PorterStemmer.step4   = step4;
PorterStemmer.step5a  = step5a;
PorterStemmer.step5b  = step5b;

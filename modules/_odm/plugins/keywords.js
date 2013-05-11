function keywords(schema, options) {
  options || (options = {});
  var target = options.target || "keywords",
    source = options.source,
    minLength = options.minLength || 2,
    invalidChar = options.invalidChar || "",
    naturalize = options.naturalize || false,
    fr = "àáâãäåçèéêëìíîïñðóòôõöøùúûüýÿ",
    to = "aaaaaaceeeeiiiinooooooouuuuyy",
    fields = {},
    PorterStemmer = require("./keywords/porter_stemmer");

  if (!(source instanceof Array)) source = [source];
  if (!schema.paths[target]) {
    fields[target] = [String];
  }
  if (!schema.paths[source]) {
    for (var i = 0; i < source.length; i++) {
      fields[source[i]] = String;
    }
  }
  schema.add(fields);
  schema.pre("save", function (next) {
    var words = [];
    for (var i = 0; i < source.length; i++) {
      var add = this.extractKeywords(this[source[i]]);
      for (var s = 0; s < add.length; s++) {
        if (!~words.indexOf(add[s])) words.push(add[s]);
      }
    }
    this[target] = words;
    next();
  });
  ["static", "method"].forEach(function (method) {
    schema[method]("extractKeywords", function (str) {
      if (!str) return [];
      str = str.replace(/^\s+|\s+$/g, "").toLowerCase();
      for (var i = 0; i < fr.length; i++) {
        str = str.replace(new RegExp(fr.charAt(i), "g"), to.charAt(i));
      }
      str = str.replace(/[^a-z0-9 -]/g, invalidChar).replace(new RegExp("[" + invalidChar + "]" + "+", "g"), invalidChar).split(/\s+/).filter(function (v) {
        return v.length >= minLength;
      }).filter(function (v, i, a) {
        return a.lastIndexOf(v) === i;
      });
      if (naturalize) {
        str.forEach(function (v, i, arr) {
          arr[i] = PorterStemmer.stem(v);
        });
      }
      return str;
    });
  });
}

module.exports = keywords;

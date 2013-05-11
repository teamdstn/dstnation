function slugify(schema, options) {
  options || (options = {});
  var target = options.target || "slug",
    source = options.source || "title",
    maxLength = options.maxLength || 50,
    spaceChar = options.spaceChar || "-",
    invalidChar = options.invalidChar || "",
    override = options.override || false,
    fr = "àáâãäåçèéêëìíîïñðóòôõöøùúûüýÿ",
    to = "aaaaaaceeeeiiiinooooooouuuuyy",
    fields = {};
  if (!schema.paths[target]) {
    fields[target] = {
      type: String,
      unique: true,
      sparse: true
    };
  }
  if (!schema.paths[source]) {
    fields[source] = String;
  }
  schema.add(fields);
  ["static", "method"].forEach(function (method) {
    schema[method]("slugify", function (str) {
      if (!str) return;
      str = str.replace(/^\s+|\s+$/g, "").toLowerCase();
      for (var i = 0; i < fr.length; i++) {
        str = str.replace(new RegExp(fr.charAt(i), "g"), to.charAt(i));
      }
      return str.replace(/[^a-z0-9 -]/g, invalidChar).replace(new RegExp("[" + invalidChar + "]" + "+", "g"), invalidChar).replace(/\s+/g, spaceChar).substr(0, maxLength);
    });
  });
  schema.pre("save", function (next) {
    if (!this[target] || override) {
      this[target] = this.slugify(this[source]);
    }
    next();
  });
}

module.exports = slugify;

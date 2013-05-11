function removeDefaults(schema, options) {
  options = options || {};
  schema.method("removeDefaults", function () {
    var self = this;
    schema.eachPath(function (name, path) {
      var current = self._doc[name],
        defaults = path.defaultValue;
      if (toString.call(current) === "[object Number]") {
        current = Number(current);
        defaults = Number(defaults);
      }
      if (current === defaults) {
        delete self._doc[name];
      }
    });
    return this;
  });
}

module.exports = removeDefaults;

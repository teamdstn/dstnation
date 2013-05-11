function _propertyInflector(document, property, value) {
  if (property.length > 1) {
    document[property[0]] = document[property[0]] || {};
    return _propertyInflector(document[property[0]], property.slice(1), value);
  } else {
    document[property[0]] = value;
    return document;
  }
}

function _toAliasedFieldsObjectProvider(schema) {
  return function toAliasedFieldsObject() {
    var document = {};
    for (var p in schema.paths) {
      var property = schema.paths[p];
      if (this.get(property.path) !== undefined) {
        if (property.options.alias && "string" == typeof property.options.alias && property.options.alias != "") {
          var alias = property.options.alias.split(".");
          _propertyInflector(document, alias, this.get(property.path));
        } else {
          document[property.path] = this.get(property.path);
        }
      }
    }
    return document;
  };
}

module.exports = exports = function fieldsAliasPlugin(schema, options) {
  for (path in schema.paths) {
    if (schema.paths[path].options.alias && "string" == typeof schema.paths[path].options.alias && schema.paths[path].options.alias != "") {
      var aliased_property = schema.paths[path].options.alias;
      console.info("[33m%s [0m: [33m[1m%j [0m", "ERR", aliased_property);
      var real_property = schema.paths[path].path;
      schema.virtual(aliased_property).get(function (prop) {
        return function () {
          return this.get(prop);
        };
      }(real_property)).set(function (prop) {
        return function (value) {
          return this.set(prop, value);
        };
      }(real_property));
    }
  }
  schema.methods.toAliasedFieldsObject = _toAliasedFieldsObjectProvider(schema);
};

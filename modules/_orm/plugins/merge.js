function nestedPath(obj, path, val) {
  if (typeof obj !== "object") {
    return obj;
  }
  var keys = path.split(".");
  if (keys.length > 1) {
    path = keys.shift();
    return nestedPath(obj[path], keys.join("."), val);
  }
  if (val !== undefined) {
    obj[path] = val;
  }
  return obj[path];
}

function merge(schema, options) {
  options = options || {};
  schema.method("merge", function (doc) {
    var self = this;
    schema.eachPath(function (name) {
      var val = nestedPath(doc, name);
      if (name !== "_id" && val !== undefined) {
        nestedPath(self, name, val);
      }
    });
    return this;
  });
}

module.exports = merge;

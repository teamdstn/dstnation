var async = require("async");

var mongoose = require("mongoose");

var denormalizeFrom = function (schema, from) {
    return function (next) {
      var self = this;
      var funcs = [];
      for (var key in from) {
        var items = from[key];
        var model = mongoose.model(schema.path(key).options.ref);
        funcs.push(function (callback) {
          model.findOne({
            _id: self[key]
          }, function (err, instance) {
            if (err) return callback(err);
            items.forEach(function (item) {
              self[item.key] = instance[item.field];
            });
            callback();
          });
        });
      }
      async.parallel(funcs, function (err) {
        if (err) return next(err);
        next();
      });
    };
  };

var denormalizeTo = function (to) {
    return function (next) {
      var self = this;
      var funcs = [];
      for (var name in to) {
        for (var ref in to[name]) {
          var items = to[name][ref];
          var model = mongoose.model(name);
          funcs.push(function (callback) {
            var query = {};
            var update = {};
            query[ref] = self._id;
            items.forEach(function (item) {
              update[item.key] = self[item.field];
            });
            model.update(query, update, {
              multi: true
            }, callback);
          });
        }
      }
      async.parallel(funcs, function (err) {
        if (err) return next(err);
        next();
      });
    };
  };

module.exports = function (schema, fields) {
  var from = {};
  var to = {};
  for (var field in fields) {
    var options = fields[field];
    if (options.from) {
      if (schema.path(options.from).options.ref === undefined) {
        throw new Error("Must denomalize from a `ref` field");
      }
      options.key || (options.key = options.from + "_" + field);
      options.type || (options.type = String);
      var item = {};
      item[options.key] = {
        type: options.type
      };
      schema.add(item);
      from[options.from] || (from[options.from] = []);
      from[options.from].push({
        field: field,
        key: options.key,
        type: options.type
      });
    } else if (options.to) {
      options.key || (options.key = options.ref + "_" + field);
      to[options.to] || (to[options.to] = {});
      to[options.to][options.ref] || (to[options.to][options.ref] = []);
      to[options.to][options.ref].push({
        field: field,
        key: options.key
      });
    } else {
      throw new Error("Must specify a direction");
    }
  }
  schema.pre("save", denormalizeFrom(schema, from));
  schema.pre("save", denormalizeTo(to));
};

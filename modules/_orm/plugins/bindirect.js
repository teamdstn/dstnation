
(function(window, undefined) {
  "use strict";

  var bindFrom = function (schema, from) {
    return function (next) {
      var self = this;
      var funcs = [];
      for (var key in from) {
        var items = from[key];
        var model = $g.orm.getModel(schema.path(key).options.ref);
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
      $g.async.parallel(funcs, function (err) {
        if (err) return next(err);
        next();
      });
    };
  };

  var bindTo = function (to) {
    return function (next) {
      var self = this;
      var funcs = [];
      for (var name in to) {
        for (var ref in to[name]) {
          var items = to[name][ref];
          var model = $g.orm.getModel(name);
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
      $g.async.parallel(funcs, function (err) {
        if (err) return next(err);
        next();
      });
    };
  };

  var bidrect = function (schema, fields) {

    // Fields that will be saved to foreign models
    // when this schema's model is saved.
    var from = {};
    // Fields that will be saved in this schema's model
    // when the foreign model is saved.
    var to = {};
    // Collect fields by "direction"
    for (var field in fields) {
      var options = fields[field];
      if (options.from) {
        // Ensure the `from` field is a ref
        if (schema.path(options.from).options.ref === undefined) {
          throw new Error('Must denomalize from a `ref` field');
        }
        // Defaults
        options.key || (options.key = options.from + '_' + field);
        options.type || (options.type = String);
        // Add key to schema in which to denormalize the foreign data
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
        options.key || (options.key = options.ref + '_' + field);
        to[options.to] || (to[options.to] = {});
        to[options.to][options.ref] || (to[options.to][options.ref] = []);
        to[options.to][options.ref].push({
          field: field,
          key: options.key
        });
      } else {
        throw new Error('Must specify a direction');
      }
    }
    // Pre-save hooks to perform the denormalization
    schema.pre('save', bindFrom(schema, from));
    schema.pre('save', bindTo(to));
  };

  var __instance = bidrect, __name = "bidrect", __nms = "$g";
  var freeExports="object"==typeof exports&&exports&&("object"==typeof global&&global&&global==global.global&&(window=global),exports);
  "function"==typeof define&&"object"==typeof define.amd&&define.amd?(window[__name]=__instance,define(function(){return __instance})):freeExports?"object"==typeof module&&module&&module.exports==freeExports?(module.exports=__instance)[__name]=__instance:freeExports[__name]=__instance
  :(window[__nms]=window[__nms]||{},window[__nms][__name]=__instance);

}(this));

var _ = require("underscore");

module.exports = {
  "in": function (whitelist) {
    return function filter(schema) {
      schema.method("filter", function (callback) {
        var validProperties = JSON.parse(JSON.stringify(this));
        var results = Object.create(null);
        _.each(validProperties, function (value, key) {
          if (_.include(whitelist, key)) {
            results[key] = value;
          }
        });
        return results;
      });
      schema.static("whitelist", function () {
        return whitelist;
      });
      schema.static("blacklist", function () {
        return null;
      });
    };
  },
  out: function (blacklist) {
    return function filter(schema) {
      schema.method("filter", function (callback) {
        var validProperties = JSON.parse(JSON.stringify(this));
        var results = Object.create(null);
        _.each(validProperties, function (value, key) {
          if (!_.include(blacklist, key)) {
            results[key] = value;
          }
        });
        return results;
      });
      schema.static("whitelist", function () {
        return null;
      });
      schema.static("blacklist", function () {
        return blacklist;
      });
    };
  }
};

var fs      = require("fs")
  , async   = require("../async")
  , formats = require("./formats")
  , Memory  = require("./stores/memory").Memory;

var common = exports;
common.async = async;
common.path = function(key) {
    return key.split(":");
};

common.key = function() {
    return Array.prototype.slice.call(arguments).join(":");
};

common.loadFiles = function(files, callback) {
    if (!files) {
        return callback(null, {});
    }
    var options = Array.isArray(files) ? {
        files: files
    } : files;
    options.format = options.format || formats.json;
    function parseFile(file, next) {
        fs.readFile(file, function(err, data) {
            return !err ? next(null, options.format.parse(data.toString())) : next(err);
        });
    }
    async.map(files, parseFile, function(err, objs) {
        return err ? callback(err) : callback(null, common.merge(objs));
    });
};

common.loadFilesSync = function(files) {
    if (!files) {
        return;
    }
    var options = Array.isArray(files) ? {
        files: files
    } : files;
    options.format = options.format || formats.json;
    return common.merge(files.map(function(file) {
        return options.format.parse(fs.readFileSync(file, "utf8"));
    }));
};

common.merge = function(objs) {
    var store = new Memory();
    objs.forEach(function(obj) {
        Object.keys(obj).forEach(function(key) {
            store.merge(key, obj[key]);
        });
    });
    return store.store;
};

common.capitalize = function(str) {
    return str && str[0].toUpperCase() + str.slice(1);
};
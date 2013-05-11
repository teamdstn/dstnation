var format = require("util").format;

var __levels = [ "result", "error", "warn", "info", "debug" ];
var __colors = [ 36, 31, 33, 36, 90 ];

var slice = Array.prototype.slice;
var globalConfig = {
    level : 3,
    colors: true
};

var Logger = function(name, level) {
    var createMethod = function(type) {
        return function() {
            var currentLevel = level === void 0 ? level : globalConfig.level;
            var index = __levels.indexOf(type);
            if (index > currentLevel) {
                return;
            }
            var args = slice.call(arguments);
            var prefix = name ? type + " [" + name + "]:" : type + ":";
            if (globalConfig.colors) {
                prefix = "[" + __colors[index] + "m" + prefix + "[39m";
            }
            args[0] = prefix + " " + args[0];
            console.log(format.apply(null, args));
        };
    };
    __levels.forEach(function(level) {
        this[level] = createMethod(level);
    }, this);
};

exports.create = function(name, level) {
    return new Logger(name, level);
};

exports.setLevel = function(level) {
    globalConfig.level = level;
};

exports.colors = function(use) {
    globalConfig.colors = !!use;
};
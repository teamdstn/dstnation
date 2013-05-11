//[] :____________________
var SPECIAL_KEYS  = require("./_webdrive/special-keys")
  , webdriver     = require("./_webdrive/webdriver")
;//_________________________________

var __slice = Array.prototype.slice;

var parseRemoteWdConfig = function(args) {
    var accessKey, host, path, port, username, _ref;
    if (typeof (args != null ? args[0] : void 0) === "object") {
        return args[0];
    } else {
        host = args[0], port = args[1], username = args[2], accessKey = args[3];
        return {
            host: host,
            port: port,
            username: username,
            accessKey: accessKey
        };
    }
};

exports.remote = function() {
    var args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    var rwc = parseRemoteWdConfig(args);
    return new webdriver(rwc);
};

exports.SPECIAL_KEYS = SPECIAL_KEYS;
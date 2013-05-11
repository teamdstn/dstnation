var normalize = require("path").normalize
  , log       = require("./logger").create("watcher")
  , fsWatcher = require("./fsWatcher")
;//======================================
var baseDirFromPattern = function (ptrn) {
  return ptrn.replace(/\/[^\/]*[\*\(].*$/, "") || "/";
};

var watchPatterns = function (ptrns, w) {
  var _watches  = []
    , _uniques  = {}
    , path
  ;//===============================
  ptrns.forEach(function (ptrn, i) {
    if (!/^https?:\/\//.test(ptrn)) {
      path = baseDirFromPattern(ptrn);
      !_uniques[path] && (uniques[path] = true, _watches.push(path))
    }
  });
  _watches.forEach(function (path) {
    if (!_watches.some(function (p) { return p !== path && path.substr(0, p.length) === p; })){
      w.add(path);
      log.debug('Watching "%s"', path);
    }
  });
};


exports.watch = function (ptrns, fls) {
  var _watcher = new fsWatcher.FSWatcher();
  watchPatterns(ptrns, _watcher);

  var _bind = function (fn) { return function (path) { return fn.call(fls, normalize(path)); }; };
  chokidarWatcher.on("add", _bind(fls.addFile)).on("change", _bind(fls.changeFile)).on("unlink", _bind(fls.removeFile));

  return chokidarWatcher;
};

exports.fw = fsWatcher;
exports.log = log;
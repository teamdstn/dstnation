var path = require("path");

exports.offset = function (cwd, opts) {
  if (cwd === undefined) cwd = process.cwd();
  if (!opts) opts = {};
  var platform = opts.platform || process.platform;
  var isWindows = /^win/.test(platform);
  var sep = isWindows ? /[\\\/]/ : "/";
  var init = isWindows ? "" : "/";
  var join = function (x, y) {
      var ps = [].slice.call(arguments).filter(function (p) {
        return p && typeof p === "string";
      });
      return path.normalize(ps.join(isWindows ? "\\" : "/"));
    };
  var res = path.normalize(cwd).split(sep).reduce(function (acc, dir, ix) {
    return acc.concat(join(acc[ix], dir));
  }, [init]).slice(1).reverse();
  if (res[0] === res[1]) return [res[0]];
  return res;
};

var rxBase = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?([\\\/])?([\s\S]*?)$/;
var rxTail = /^([\s\S]+[\\\/](?!$)|[\\\/])?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/\\]*)?)$/;
var rxPath = /^(\/?)([\s\S]+\/(?!$)|\/)?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/]*)?)$/;

function normalizeArray(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last == ".") {
      parts.splice(i, 1);
    } else if (last === "..") {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift("..");
    }
  }
  return parts;
}

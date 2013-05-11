var crypto = require("crypto");

var serialize = function (name, val, opt) {
    var pairs = [name + "=" + encode(val)];
    opt = opt || {};
    if (opt.maxAge)   pairs.push("Max-Age=" + opt.maxAge);
    if (opt.domain)   pairs.push("Domain=" + opt.domain);
    if (opt.path)     pairs.push("Path=" + opt.path);
    if (opt.expires)  pairs.push("Expires=" + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push("HttpOnly");
    if (opt.secure)   pairs.push("Secure");
    return pairs.join("; ");
  };

var parse = function (str) {
    var obj = {};
    var pairs = str.split(/[;,] */);
    pairs.forEach(function (pair) {
      var eq_idx = pair.indexOf("=");
      var key = pair.substr(0, eq_idx).trim();
      var val = pair.substr(++eq_idx, pair.length).trim();
      if ('"' == val[0]) {
        val = val.slice(1, - 1);
      }
      if (undefined == obj[key]) {
        obj[key] = decode(val);
      }
    });
    return obj;
  };


var encode = encodeURIComponent;
var decode = decodeURIComponent;
module.exports.serialize = serialize;
module.exports.parse = parse;

exports.sign = function (val, secret) {
  return val + "." + crypto.createHmac("sha256", secret).update(val).digest("base64").replace(/=+$/, "");
};

exports.unsign = function (val, secret) {
  var str = val.slice(0, val.lastIndexOf("."));
  return exports.sign(str, secret) == val ? str : false;
};

exports.parseSignedCookies = function (obj, secret) {
  var ret = {};
  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    if (0 == val.indexOf("s:")) {
      val = exports.unsign(val.slice(2), secret);
      if (val) {
        ret[key] = val;
        delete obj[key];
      }
    }
  });
  return ret;
};

exports.parseSignedCookie = function (str, secret) {
  return 0 == str.indexOf("s:") ? exports.unsign(str.slice(2), secret) : str;
};

exports.parseJSONCookies = function (obj) {
  Object.keys(obj).forEach(function (key) {
    var val = obj[key];
    var res = exports.parseJSONCookie(val);
    if (res) obj[key] = res;
  });
  return obj;
};

exports.parseJSONCookie = function (str) {
  if (0 == str.indexOf("j:")) {
    try {
      return JSON.parse(str.slice(2));
    } catch (err) {}
  }
};

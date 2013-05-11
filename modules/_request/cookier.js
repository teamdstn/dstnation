var url = require("url");

var CookieJar = function CookieJar() {
    this.cookies = [];
};

CookieJar.prototype.add = function(cookie) {
    this.cookies = this.cookies.filter(function(c) {
        return !(c.name == cookie.name && c.path == cookie.path);
    });
    this.cookies.push(cookie);
};

CookieJar.prototype.get = function(req) {

  var path = url.parse(Object(req) === req ? req.url : req).pathname, now = new Date(), specificity = {};
  return this.cookies.filter(function(cookie) {
      if (0 == path.indexOf(cookie.path) && now < cookie.expires && cookie.path.length > (specificity[cookie.name] || 0)) return specificity[cookie.name] = cookie.path.length;
  });
};


CookieJar.prototype.cookieString = function(req) {
    var cookies = this.get(req);
    if (cookies.length) {
        return cookies.map(function(cookie) {
            return cookie.name + "=" + cookie.value;
        }).join("; ");
    }
};

var Cookie = function Cookie(str, req) {
    this.str = str;
    str.split(/ *; */).reduce(function(obj, pair) {
        var p = pair.indexOf("=");
        var key = p > 0 ? pair.substring(0, p).trim() : pair.trim();
        var lowerCasedKey = key.toLowerCase();
        var value = p > 0 ? pair.substring(p + 1).trim() : true;
        if (!obj.name) {
            obj.name = key;
            obj.value = value;
        } else if (lowerCasedKey === "httponly") {
            obj.httpOnly = value;
        } else {
            obj[lowerCasedKey] = value;
        }
        return obj;
    }, this);
    this.expires = this.expires ? new Date(this.expires) : Infinity;
    this.path = this.path ? this.path.trim() : req ? url.parse(req.url).pathname : "/";
};

Cookie.prototype.toString = function() {
    return this.str;
};

exports.cook = function(str, req) {
    return new Cookie(str, req);
};

exports.jar = function() {
    return new CookieJar();
};
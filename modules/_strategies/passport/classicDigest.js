//[] :______________________________
var Proto   = require("./index")
  , crypto  = require("crypto")
;//_________________________________

exports.Strategy = Strategy;
function Strategy(options, secret, validate) {
  if (typeof options == "function") {
    validate = secret;
    secret = options;
    options = {};
  }
  if (!secret) throw new Error("HTTP Digest authentication strategy requires a secret function");
  Proto.call(this);
  this.name = "digest";
  this._secret = secret;
  this._validate = validate;
  this._realm = options.realm || "Users";
  if (options.domain) {
    this._domain = Array.isArray(options.domain) ? options.domain : [options.domain];
  }
  this._opaque = options.opaque;
  this._algorithm = options.algorithm;
  if (options.qop) {
    this._qop = Array.isArray(options.qop) ? options.qop : [options.qop];
  }
}

Proto.inherits(Strategy, Proto);

Strategy.prototype.authenticate = function (req) {
  var authorization = req.headers["authorization"];
  if (!authorization) {
    return this.fail(this._challenge());
  }
  var parts = authorization.split(" ");
  if (parts.length < 2) {
    return this.fail(400);
  }
  var scheme = parts[0],
    params = parts.slice(1).join(" ");
  if (!/Digest/i.test(scheme)) {
    return this.fail(this._challenge());
  }
  var creds = parse(params);
  if (!creds.username) {
    return this.fail(400);
  }
  if (req.url !== creds.uri) {
    return this.fail(400);
  }
  var self = this;
  this._secret(creds.username, function (err, user, password) {
    if (err) {
      return self.error(err);
    }
    if (!user) {
      return self.fail(self._challenge());
    }
    var ha1;
    if (!creds.algorithm || creds.algorithm === "MD5") {
      if (typeof password === "object" && password.ha1) {
        ha1 = password.ha1;
      } else {
        ha1 = md5(creds.username + ":" + creds.realm + ":" + password);
      }
    } else if (creds.algorithm === "MD5-sess") {
      ha1 = md5(md5(creds.username + ":" + creds.realm + ":" + password) + ":" + creds.nonce + ":" + creds.cnonce);
    } else {
      return self.fail(400);
    }
    var ha2;
    if (!creds.qop || creds.qop === "auth") {
      ha2 = md5(req.method + ":" + creds.uri);
    } else if (creds.qop === "auth-int") {
      return self.error(new Error("auth-int not implemented"));
    } else {
      return self.fail(400);
    }
    var digest;
    if (!creds.qop) {
      digest = md5(ha1 + ":" + creds.nonce + ":" + ha2);
    } else if (creds.qop === "auth" || creds.qop === "auth-int") {
      digest = md5(ha1 + ":" + creds.nonce + ":" + creds.nc + ":" + creds.cnonce + ":" + creds.qop + ":" + ha2);
    } else {
      return self.fail(400);
    }
    if (creds.response != digest) {
      return self.fail(self._challenge());
    } else {
      if (self._validate) {
        self._validate({
          nonce: creds.nonce,
          cnonce: creds.cnonce,
          nc: creds.nc,
          opaque: creds.opaque
        }, function (err, valid) {
          if (err) {
            return self.error(err);
          }
          if (!valid) {
            return self.fail(self._challenge());
          }
          self.success(user);
        });
      } else {
        self.success(user);
      }
    }
  });
};

Strategy.prototype._challenge = function () {
  var challenge = 'Digest realm="' + this._realm + '"';
  if (this._domain) {
    challenge += ', domain="' + this._domain.join(" ") + '"';
  }
  challenge += ', nonce="' + nonce(32) + '"';
  if (this._opaque) {
    challenge += ', opaque="' + this._opaque + '"';
  }
  if (this._algorithm) {
    challenge += ", algorithm=" + this._algorithm;
  }
  if (this._qop) {
    challenge += ', qop="' + this._qop.join(",") + '"';
  }
  return challenge;
};

function parse(params) {
  var opts = {};
  var tokens = params.split(/,(?=(?:[^"]|"[^"]*")*$)/);
  for (var i = 0, len = tokens.length; i < len; i++) {
    var param = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
    if (param) {
      opts[param[1]] = param[2];
    }
  }
  return opts;
}

function nonce(len) {
  var buf = [],
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    charlen = chars.length;
  for (var i = 0; i < len; ++i) {
    buf.push(chars[Math.random() * charlen | 0]);
  }
  return buf.join("");
}

function md5(str, encoding) {
  return crypto.createHash("md5").update(str).digest(encoding || "hex");
}

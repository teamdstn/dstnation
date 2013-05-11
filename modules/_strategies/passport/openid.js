//[] :____________________
var Proto               = require("./index")
  , openid              = require("./../../openid")
  , BadRequestError     = Proto.BadRequestError
  , InternalOpenIDError = Proto.InternalOpenIDError
;//_________________________________
exports.Strategy            = Strategy;
exports.BadRequestError     = BadRequestError;
exports.InternalOpenIDError = InternalOpenIDError;
exports.discover = function (fn) { discoverers.push(fn); };

function Strategy(options, verify) {
  if (!options.returnURL) throw new Error("OpenID authentication requires a returnURL option");
  //if (!verify) throw new Error("OpenID authentication strategy requires a verify callback");
  Proto.call(this);
  this.name = "openid";
  this._verify = verify;
  this._profile = options.profile;
  this._passReqToCallback = options.passReqToCallback;
  var extensions = [];
  if (options.profile) {
    var sreg = new openid.SimpleRegistration({
      fullname: true,
      nickname: true,
      email: true,
      dob: true,
      gender: true,
      postcode: true,
      country: true,
      timezone: true,
      language: true
    });
    extensions.push(sreg);
  }
  if (options.profile) {
    var ax = new openid.AttributeExchange({
      "http://axschema.org/namePerson/first": "required",
      "http://axschema.org/namePerson/last" : "required",
      "http://axschema.org/contact/email"   : "required"
    });
    extensions.push(ax);
  }
  this._relyingParty = new openid.RelyingParty(options.returnURL, options.realm, options.stateless === undefined ? false : options.stateless, options.secure === undefined ? true : options.secure, extensions);
  this._providerURL = options.providerURL;
  this._identifierField = options.identifierField || "openid_identifier";
}

Proto.inherits(Strategy, Proto);


Strategy.prototype.authenticate = function (req) {
  if (req.query && req.query["openid.mode"]) {
    if (req.query["openid.mode"] === "cancel") {
      return this.fail({
        message: "OpenID authentication canceled"
      });
    }
    var self = this;
    this._relyingParty.verifyAssertion(req.url, function (err, result) {
      if (err) {
        return self.error(new InternalOpenIDError("Failed to verify assertion", err));
      }
      if (!result.authenticated) {
        return self.error(new Error("OpenID authentication failed"));
      }
      var profile = self._parseProfileExt(result);

      function verified(err, user, info) {
        if (err) {
          return self.error(err);
        }
        if (!user) {
          return self.fail(info);
        }
        self.success(user, info);
      }
      var arity = self._verify.length;
      if (self._passReqToCallback) {
        if (arity == 4 || self._profile) {
          self._verify(req, result.claimedIdentifier, profile, verified);
        } else {
          self._verify(req, result.claimedIdentifier, verified);
        }
      } else {
        if (arity == 3 || self._profile) {
          self._verify(result.claimedIdentifier, profile, verified);
        } else {
          self._verify(result.claimedIdentifier, verified);
        }
      }
    });
  } else {
    var identifier = undefined;
    if (req.body && req.body[this._identifierField]) {
      identifier = req.body[this._identifierField];
    } else if (req.query && req.query[this._identifierField]) {
      identifier = req.query[this._identifierField];
    } else if (this._providerURL) {
      identifier = this._providerURL;
    }
    if (!identifier) {
      return this.fail(new BadRequestError("Missing OpenID identifier"));
    }
    var self = this;
    this._relyingParty.authenticate(identifier, false, function (err, providerUrl) {
      if (err || !providerUrl) {
        return self.error(new InternalOpenIDError("Failed to discover OP endpoint URL", err));
      }
      self.redirect(providerUrl);
    });
  }
};

Strategy.prototype.saveAssociation = function (fn) {
  openid.saveAssociation = function (provider, type, handle, secret, expiry, callback) {
    fn(handle, provider, type, secret, expiry, callback);
  };
  return this;
};

Strategy.prototype.loadAssociation = function (fn) {
  openid.loadAssociation = function (handle, callback) {
    fn(handle, function (err, provider, algorithm, secret) {
      if (err) {
        return callback(err, null);
      }
      var obj = {
        provider: provider,
        type: algorithm,
        secret: secret
      };
      return callback(null, obj);
    });
  };
  return this;
};

Strategy.prototype.saveDiscoveredInfo = Strategy.prototype.saveDiscoveredInformation = function (fn) {
  openid.saveDiscoveredInformation = fn;
  return this;
};

Strategy.prototype.loadDiscoveredInfo = Strategy.prototype.loadDiscoveredInformation = function (fn) {
  openid.loadDiscoveredInformation = fn;
  return this;
};

Strategy.prototype._parseProfileExt = function (params) {
  var profile = {};
  profile.displayName = params["fullname"];
  profile.emails      = [{ value: params["email"] }];
  profile.name        = { familyName: params["lastname"], givenName: params["firstname"] };
  if (!profile.displayName) {
    profile.displayName = params["firstname"] + " " + params["lastname"];
  }
  if (!profile.emails) {
    profile.emails = [{ value: params["email"] }];
  }
  return profile;
};

var discoverers = [];
var loadDiscoveredInformation = openid.loadDiscoveredInformation;

openid.loadDiscoveredInformation = function (key, callback) {
  var stack = discoverers;
  (function pass(i, err, provider) {
    if (err || provider) {
      return callback(err, provider);
    }
    var discover = stack[i];
    if (!discover) {
      return loadDiscoveredInformation(key, callback);
    }
    try {
      discover(key, function (e, p) {
        pass(i + 1, e, p);
      });
    } catch (e) {
      return callback(e);
    }
  })(0);
};

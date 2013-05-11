//[] :____________________
var fs              = require("fs")
  , util            = require("util")
  , Proto           = require("./_strategies/passport")
  , authenticate    = require("./_middlewares/passport/authenticate")
;//_________________________________

exports = module.exports = create;
function create(strategies, options){
  var _passport = new Passport(), _s;
  Proto.proxies = options.proxies;
  if(Object(strategies)===strategies){
    for (k in strategies) {
      _s = strategies[k];
      _s.s[0] !=="^" && (_passport.use(exports[_s.s](_s[k])));
    }
  } else{
    _passport.use(exports[strategies]());
  }
  return _passport;
}

function Passport() {
  this._key               = "passport";
  this._strategies        = {};
  this._serializers       = [];
  this._deserializers     = [];
  this._infoTransformers  = [];
  this._userProperty      = "user";
  this.use(exports.session());

}

require("./_graceful/http/request");


Passport.prototype.use = function (name, strategy) {
  if (!strategy) { strategy = name; name = strategy.name; }
  if (!name) throw new Error("authentication strategies must have a name");
  this._strategies[name] = strategy;
  return this;
};

Passport.prototype.unuse = function (name) {
  delete this._strategies[name];
  return this;
};

Passport.prototype.initialize = function (options) {
  options = options || {};
  this._userProperty = options.userProperty || "user";
  //return initialize().bind(this);
};

Passport.prototype.session = function () {
  return this.authenticate("session");
};

Passport.prototype.authenticate = function (strategy, options, callback) {
  return authenticate(strategy, options, callback).bind(this);
};

Passport.prototype.authorize = function (strategy, options, callback) {
  options = options || {};
  options.assignProperty = "account";
  return authenticate(strategy, options, callback).bind(this);
};

Passport.prototype.serializeUser = function (fn, done) {
  if (typeof fn === "function") {
    return this._serializers.push(fn);
  }
  var user = fn;
  var stack = this._serializers;
  (function pass(i, err, obj) {
    if ("pass" === err) {
      err = undefined;
    }
    if (err || obj) {
      return done(err, obj);
    }
    var layer = stack[i];
    if (!layer) {
      return done(new Error("failed to serialize user into session"));
    }
    try {
      layer(user, function (e, o) {
        pass(i + 1, e, o);
      });
    } catch (e) {
      return done(e);
    }
  })(0);
};

Passport.prototype.deserializeUser = function (fn, done) {
  if (typeof fn === "function") {
    return this._deserializers.push(fn);
  }
  var obj = fn;
  var stack = this._deserializers;
  (function pass(i, err, user) {
    if ("pass" === err) {
      err = undefined;
    }
    if (err || user) {
      return done(err, user);
    }
    if (user === null || user === false) {
      return done(null, false);
    }
    var layer = stack[i];
    if (!layer) {
      return done(new Error("failed to deserialize user out of session"));
    }
    try {
      layer(obj, function (e, u) {
        pass(i + 1, e, u);
      });
    } catch (e) {
      return done(e);
    }
  })(0);
};

Passport.prototype.transformAuthInfo = function (fn, done) {
  if (typeof fn === "function") {
    return this._infoTransformers.push(fn);
  }
  var info = fn;
  var stack = this._infoTransformers;
  (function pass(i, err, tinfo) {
    if ("pass" === err) {
      err = undefined;
    }
    if (err || tinfo) {
      return done(err, tinfo);
    }
    var layer = stack[i];
    if (!layer) {
      return done(null, info);
    }
    try {
      var arity = layer.length;
      if (arity == 1) {
        var t = layer(info);
        pass(i + 1, null, t);
      } else {
        layer(info, function (e, t) {
          pass(i + 1, e, t);
        });
      }
    } catch (e) {
      return done(e);
    }
  })(0);
};

Passport.prototype._strategy = function (name) {
  return this._strategies[name];
};

exports.strategies  = {};
//[] :______________________________
var fs = require("fs"), bn = require("path").basename;
(function(nm, nms){nm="_"+nm;fs.readdirSync(__dirname+"/"+nm+"/"+nms).forEach(function(f){function d(){return require("./"+nm+"/"+nms+"/"+c); }if(/\.js$/.test(f)){var c=bn(f,".js");exports.__defineGetter__(c,d)}})})
("strategies","passport")
;//_________________________________

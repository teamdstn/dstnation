//[] :____________________
var fs              = require("fs")
  , util            = require("util")
  , Proto           = require("./_strategies/plugin")
;//_________________________________

exports = module.exports = create;
function create(plugins, options){
  var _plugin = new Plugin(), _s;

  if(Object(plugins)===plugins){
    for (k in plugins) {
      _s = plugins[k];
      _s.s[0] !=="^" && (_plugin.use(exports[_s.s](_s[k])));
    }
  } else{
    _plugin.use(exports[plugins]());
  }
  return _plugin;
}

function Plugin() {
  this._key               = "plugin";
  this._plugins           = {};
  this._serializers       = [];
  this._deserializers     = [];
  this._infoTransformers  = [];
  this._properties       = "user";
  this.use(exports.session());

}

proto = {};
proto.use = function (name, plugin) {
  if (!plugin) { plugin = name; name = plugin.name; }
  if (!name) throw new Error("authentication plugins must have a name");
  this._plugins[name] = plugin;
  return this;
};

proto.initialize=function(){
  console.log("initialize");
  //options = options || {};
  //this._properties = options.properties || "user";
  //return initialize().bind(this);
}
proto.route=function(){
  console.log("route");
}

proto.unuse = function (name) {
  delete this._plugins[name];
  return this;
};

proto.authorize = function (plugin, options, callback) {
  options = options || {};
  options.assignProperty = "account";
  return authenticate(plugin, options, callback).bind(this);
};

proto.serialize = function (fn, done) {
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

proto.deserialize = function (fn, done) {
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

proto.transformAuthInfo = function (fn, done) {
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

proto._plugin = function (name) {
  return this._plugins[name];
};

exports.plugins  = {};
//[] :______________________________
var fs = require("fs"), bn = require("path").basename;
(function(nm, nms){nm="_"+nm;fs.readdirSync(__dirname+"/"+nm+"/"+nms).forEach(function(f){function d(){return require("./"+nm+"/"+nms+"/"+c); }if(/\.js$/.test(f)){var c=bn(f,".js");exports.__defineGetter__(c,d)}})})
("plugins","apps")
;//_________________________________

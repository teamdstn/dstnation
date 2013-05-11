;//}, P : {━━━━━━━━━━━━━━━━━━━
var fs      = require("fs")
  , pt      = require("path")
  , http    = require('http')
  , https   = require('https')
  , pscan   = require("../pscan")
;// }  _____________________________________
var keys=Object.keys, slice=Array.prototype.slice, toString=Object.prototype.toString , hasOwnProperty=Object.prototype.hasOwnProperty, defineProperty=Object.defineProperty
, is = {"arr": Array.prototype.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
, each = function(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }
;//--------------------------------
each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; });


function each(o, i) { keys(o).forEach(function(k) { i(o[k], k, o); }); }
function parse(req) { var parsed = req._parsedUrl; if (parsed && parsed.href == req.url) { return parsed; } else { return req._parsedUrl = parse(req.url); } }

module.exports = function (express) {

  var _mwarePath = pt.resolve(__dirname, "./../_middlewares/apps");
  (function (inst) {
    fs.readdirSync(_mwarePath).forEach(function (f) {
      function d() {
        return require(_mwarePath + pt.sep + c);
      }
      if (/\.js$/.test(f)) {
        var c = pt.basename(f, ".js");
        inst.__defineGetter__(c, d);
      }
    });
  })(express);

  express.plugins = function (fl) {
    function Plugins(method, path, callbacks, options) {

    }

  };


  /*
  var __use = express.application.use;
  express.application.use = function(route, fn){
    var app, home, handle;
    console.log(this.get("views"))
    route.app = this;
    __use.apply(this, arguments);
  };
  */

  express.application.excute = function (port, cb) {
    "function" === typeof port && (cb = port, port = pscan.any());
    var self  = this
      , server  = this.get("ca") ? https.createServer(this.get("ca"), this) : http.createServer(this);

    pscan.strict(port, function (err, port) {
      self.set("port", port);
      return server.listen.apply(server, [port, cb]);
    });
  };

  express.Router.prototype.matchRequest = function (req, i, head) {
    var method = req.method.toLowerCase()
      , url     = parse(req)
      , path    = req.exp && req.exp.route ? req.exp.route : url.pathname
      , routes  = this.map
      , i = i || 0
      , route
    ;//=====================================


    if (!head && "head" == method) {
      route = this.matchRequest(req, i, true);
      if (route) return route;
      method = "get";
    }
    if (routes = routes[method]) {
      for (var len = routes.length; i < len; ++i) {
        route = routes[i];
        if (route.match(path)) {
          req._route_index = i;
          return route;
        }
      }
    }
  };
};

/*
var __oengine = express.application.engine;
express.application.engine = function(ext, fn){
  if(/:/.test(ext)){
    ext = ext.split(":");
    if(ext[0]==="view"){
      return __oengine.apply(this, [ext[1], fn]);
    } else{
      !this[ext[0]] && (this[ext[0]]={});
      this[ext[0][ext[1]]] = fn;
    }
  }else{
    return __oengine;
  }
  return this;
}
*/

/*
var routes  = fl();

var app = this;

var plugins = {};
var options = options || {};
var routes  = fl();
var passport  = require("./../passport");


var _passport  = passport({"local":{nameFld:"name", passFld:"password", modelName:"user", plugins:"bcryption"}});
app.use(express.instance("passport", _passport, _passport.session()));


routes.istricts = [];

_passport.serializeUser(function(user, done) { done(null, user.name); });
_passport.deserializeUser(function(username, done) {  done(null, {name: username}); });


_passport.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.send({
    status: 1,
    message: "Not Authenticated"
  });
};

routes.istricts.unshift(_passport.ensureAuthenticated);

app.get("/", function (req, res) {
  res.render('index', { user: req.user, title: 'bcryption' });
});

app.get("/account", _passport.ensureAuthenticated, function (req, res) {
  res.render("account", {
    user: req.user
  });
});

app.get("/login", function (req, res) {
  res.render("login", {
    title: 'login',
    user: req.user,
    message: req.flash("error")
  });
});

app.get("/register", function (req, res) {
  res.render("register", {
    title: 'register',
    user: req.user,
    flag  : "post",
    action : "register",
    message: req.flash("error")
  });
});

app.post("/register", _passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: "/login",
    failureFlash: true
  })
);

app.put("/account", _passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: "/login",
    failureFlash: true
  })
);


app.get("/account", _passport.ensureAuthenticated, function (req, res) {
  res.render("account", {
    user: req.user
  });
});

app.get("/edit", _passport.ensureAuthenticated, function (req, res) {
  res.render("register", {
    title: 'Edit',
    user: req.user,
    flag  : "put",
    action : "account",
    message: req.flash("error")
  });
});

app.post("/login", _passport.authenticate("local", {
    successRedirect: '/',
    failureRedirect: "/login",
    failureFlash: true
  })
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

fl.routes = routes;
return fl;
*/
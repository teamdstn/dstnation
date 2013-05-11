var app       = require('../index')
  , fs        = require('fs')
  , path      = require('path')
  , trace     = require('../trace')
//require('tty').setRawMode(true);
;process.stdin.setRawMode(true);


var sites = {
  path : path.join(__dirname, './../specifics'),
  mwares : {

  }
}

console.log(sites.path);

function loadMiddlewares(){
  var rst;
  sites.mwares = {};
  if (!fs.existsSync(sites.path)) return;
  ref = fs.readdirSync(sites.path);
  rst = [];
  for (var i = 0, len = ref.length, tmp; i < len; i++) {
    tmp = ref[i];
    trace.info(tmp)
    loadMiddleware(tmp);
    rst.push(watchMiddleware(tmp));
  }
  return rst;
};

function watchMiddleware(mwares) {
  return fs.watchFile("" + sites.path + "/" + mwares, function(c, p) {
    return loadMiddleware(mwares);
  });
};

function loadMiddleware(mwares) {
  var key = mwares.replace(/\.coffee$/, '').replace(/\.js$/, '');
  trace.info("Loading: " + key);
  delete require.cache[sites.path + '/' + mwares];
  sites.mwares[key] = require(sites.path + '/' + mwares);
  fs.unwatchFile("" + sites.path + "/" + mwares);
  return watchMiddleware(mwares);
};

exports.middleware = function() {

  loadMiddlewares();

  var siteMiddleware = function(req, res, next) {
    var defaults, key, m, middlewares, cb;
    middlewares = [];
    if (defaults = sites.mwares['default']) {
      middlewares.push(defaults(app));
    }
    for (key in sites.mwares) {
      m = sites.mwares[key];
      if (req.host.match(key)) {
        console.log("Fiddling with " + req.host + " using " + key);
        middlewares = middlewares.concat(m(app));
        break;
      }
    }
    cb = function(i) {
      var n;
      if (n = middlewares[i]) {
        return function() {
          return n(req, res, cb(i + 1));
        };
      } else {
        return function() {
          return next();
        };
      }
    };
    if (middlewares.length > 0) {
      return cb(0)();
    } else {

      return next();
    }
  };
  return [siteMiddleware, app.liveLogger()];
};
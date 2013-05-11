var EventEmitter  = require('events').EventEmitter
  , Proxy         = require('./proxy').Proxy
  , $g            = require('edge')
  , conf          = $g.acq("./nconf")
  , fs            = require('fs');

// patches
require('./patch');
var mwareSites  = require('./middleware/sites');
var pluginPath    = [process.cwd(), __dirname + '/plugins'];


exports.middleware = {};
exports.__defineGetter__("liveLogger", function(){ return require("./plugins/liveLogger")});

var app = {
  create   : require('./mediator').create,
  trace    : require('./trace')
}


fs.readdirSync(__dirname + '/middleware').forEach(function(fl) {
  if (!/\.js$/.test(fl)) return;
  var nm = $g.basename(fl, '.js');
  function load(){ return require('./middleware/' + nm); }
  exports.middleware.__defineGetter__(nm, load);
  exports.__defineGetter__(nm, load);
});


app.create.apply(app, mwareSites.middleware()).listen(8001);

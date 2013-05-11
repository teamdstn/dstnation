var HTTPServer = require('./http').Server
  , HTTPSServer = require('./https').Server
  , path = require('path')
  , basename = path.basename
  , fs = require('fs');


exports = module.exports = createServer;

function createServer() {
  if ('object' == typeof arguments[0]) {
    return new HTTPSServer(arguments[0], Array.prototype.slice.call(arguments, 1));
  } else {
    return new HTTPServer(Array.prototype.slice.call(arguments));
  }
};

exports.createServer = createServer;

exports.middleware = {};

fs.readdirSync(__dirname + '/middleware').forEach(function(filename){
  if (!/\.js$/.test(filename)) return;
  var name = basename(filename, '.js');
  function load(){ return require('./middleware/' + name); }
  exports.middleware.__defineGetter__(name, load);
  exports.__defineGetter__(name, load);
});

//exports.utils.merge(exports, exports.middleware);

exports.HTTPServer  = HTTPServer;
exports.HTTPSServer = HTTPSServer;

